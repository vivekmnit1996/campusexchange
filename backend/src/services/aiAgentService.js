import { Annotation, StateGraph, MemorySaver, START, END } from '@langchain/langgraph';
import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { Product } from '../models/Product.js';
import { Store } from '../models/Store.js';
import { Order } from '../models/Order.js';

// State definition
const AgentState = Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  isOnTopic: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => true,
  }),
  refusalReason: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => '',
  }),
  intent: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => 'general',
  }),
  retrievedData: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => ({ products: [], stores: [], orders: [], policy: null }),
  }),
  userContext: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => ({}),
  }),
  recommendedProducts: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => [],
  }),
});

const getGuardrailModel = () => new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  modelName: 'openai/gpt-oss-20b',
  temperature: 0.0,
});

const getSynthesizerModel = () => new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  modelName: 'openai/gpt-oss-120b',
  temperature: 0.3,
  maxTokens: 1024,
});

const MARKETPLACE_SCOPE_PROMPT = `
You are the Security & Domain Guardrail Classifier for "MarketPulse", an enterprise multi-vendor e-commerce marketplace platform.

YOUR TASK:
Determine strictly whether the user's latest query is ALLOWED or OFF-TOPIC.

ALLOWED DOMAINS (Answer YES):
1. Any question about products, categories, specs, prices, stock, comparisons, or recommendations on MarketPulse.
2. Inquiries about vendor stores, sellers, store ratings, store inventories.
3. Inquiries about orders, order tracking, shipping status, payments, escrow ledger, refunds, returns, or cart/checkout.
4. Information regarding MarketPulse platform features, neo-brutalist UI, vendor portal, admin hub, concurrency engine, API docs.
5. Standard marketplace conversational greetings, pleasantries, or questions about what the assistant can do ("Hello", "What can you help me with?", "Who are you?").

OFF-TOPIC / DISALLOWED DOMAINS (Answer NO):
1. General world knowledge, history, geography, celebrity gossip, pop culture unrelated to MarketPulse.
2. Math homework, physics, chemistry, biology, general academic assignments.
3. Generic programming or coding assistance unrelated to MarketPulse APIs/architecture.
4. Creative writing (poetry, fiction, songs) unrelated to MarketPulse products.
5. Political discussions, medical advice, legal advice, financial trading advice outside MarketPulse payments.

OUTPUT FORMAT:
Return a JSON object ONLY:
{
  "isOnTopic": true | false,
  "intent": "product_search" | "product_recommendation" | "store_inquiry" | "order_tracking" | "policy_inquiry" | "marketplace_general" | "off_topic",
  "searchKeywords": "Extracted search terms"
}
`;

async function guardrailNode(state) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  const queryText = typeof lastMessage.content === 'string' ? lastMessage.content : '';

  const trimmed = queryText.trim().toLowerCase();
  if (['hi', 'hello', 'hey', 'help', 'who are you', 'what can you do', 'good morning', 'good evening'].includes(trimmed)) {
    return {
      isOnTopic: true,
      intent: 'marketplace_general',
      refusalReason: '',
      retrievedData: state.retrievedData || {},
    };
  }

  try {
    const model = getGuardrailModel();
    const response = await model.invoke([
      new SystemMessage(MARKETPLACE_SCOPE_PROMPT),
      new HumanMessage(`User query: "${queryText}"\nEvaluate domain relevance. JSON ONLY:`),
    ]);

    const content = response.content.toString();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { isOnTopic: true, intent: 'product_search', refusalReason: '' };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      isOnTopic: Boolean(parsed.isOnTopic),
      intent: parsed.intent || (parsed.isOnTopic ? 'product_search' : 'off_topic'),
      refusalReason: parsed.isOnTopic 
        ? '' 
        : 'I am MarketPulse AI, exclusively dedicated to assisting you with products, orders, vendor stores, and shopping on the MarketPulse marketplace. I cannot answer queries outside of this platform.',
      retrievedData: {
        ...(state.retrievedData || {}),
        searchKeywords: parsed.searchKeywords || queryText,
      }
    };
  } catch (error) {
    return { isOnTopic: true, intent: 'marketplace_general', refusalReason: '' };
  }
}

async function toolsNode(state) {
  const { intent, retrievedData = {}, userContext = {} } = state;
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  const queryText = typeof lastMessage.content === 'string' ? lastMessage.content : '';
  const searchKeywords = retrievedData.searchKeywords || queryText;

  let products = [];
  let stores = [];
  let orders = null;

  try {
    const filter = { isActive: true };
    if (searchKeywords && searchKeywords.trim()) {
      const q = searchKeywords.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ];
    }
    const dbProducts = await Product.find(filter).populate('store', 'name slug').sort({ rating: -1 }).limit(6).lean();
    products = dbProducts.map(p => ({
      id: p._id.toString(),
      title: p.title,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      stock: p.stock,
      category: p.category,
      rating: p.rating,
      numReviews: p.numReviews,
      image: p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      storeName: p.store?.name || 'Verified Store',
      storeSlug: p.store?.slug || '',
      description: p.description?.substring(0, 150) + '...',
    }));

    if (products.length === 0) {
      const fallbackProds = await Product.find({ isActive: true }).populate('store', 'name slug').limit(4).lean();
      products = fallbackProds.map(p => ({
        id: p._id.toString(),
        title: p.title,
        slug: p.slug,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        stock: p.stock,
        category: p.category,
        rating: p.rating,
        numReviews: p.numReviews,
        image: p.images?.[0] || '',
        storeName: p.store?.name || 'Verified Store',
      }));
    }
  } catch (e) {
    console.error('[AI Tools Error]:', e.message);
  }

  return {
    retrievedData: { ...retrievedData, products, stores, orders },
    recommendedProducts: products,
  };
}

async function refusalNode(state) {
  const refusalMessage = state.refusalReason || 
    "I am the MarketPulse Marketplace AI Assistant. I can only answer questions related to MarketPulse products, vendor stores, order status, shipping, checkout, and marketplace policies.";
  return {
    messages: [new AIMessage(refusalMessage)],
    recommendedProducts: [],
  };
}

async function synthesisNode(state) {
  const { messages, retrievedData = {}, userContext = {} } = state;
  const products = retrievedData.products || [];

  const systemInstructions = `
You are MarketPulse AI, an intelligent shopping assistant embedded within the MarketPulse Multi-Vendor Marketplace.

### STRICT SCOPE RULE:
- You ONLY provide information regarding MarketPulse products, vendor stores, orders, checkout, shipping, and platform policies.
- If the user tries to ask off-topic subjects, politely redirect them back to MarketPulse.

### CURRENT LIVE MARKETPLACE PRODUCTS FOUND:
${JSON.stringify(products.map(p => ({
  id: p.id,
  title: p.title,
  price: `$${p.price}`,
  rating: `${p.rating} ★`,
  category: p.category,
  store: p.storeName,
  stock: p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'
})), null, 2)}

Format your responses with bold highlights, tables or bullet points, and helpful tone.
`;

  try {
    const model = getSynthesizerModel();
    const chatHistory = messages.map(m => {
      if (m._getType && m._getType() === 'human') return new HumanMessage(m.content);
      if (m._getType && m._getType() === 'ai') return new AIMessage(m.content);
      return m;
    });

    const response = await model.invoke([
      new SystemMessage(systemInstructions),
      ...chatHistory,
    ]);

    return {
      messages: [response],
      recommendedProducts: products,
    };
  } catch (err) {
    return {
      messages: [new AIMessage("Here are some matching products from our marketplace catalog below!")],
      recommendedProducts: products,
    };
  }
}

function checkGuardrailRoute(state) {
  return state.isOnTopic === false ? 'refusal' : 'tools';
}

const memory = new MemorySaver();
const workflow = new StateGraph(AgentState)
  .addNode('guardrail', guardrailNode)
  .addNode('tools', toolsNode)
  .addNode('refusal', refusalNode)
  .addNode('synthesis', synthesisNode)
  .addEdge(START, 'guardrail')
  .addConditionalEdges('guardrail', checkGuardrailRoute, {
    refusal: 'refusal',
    tools: 'tools',
  })
  .addEdge('tools', 'synthesis')
  .addEdge('synthesis', END)
  .addEdge('refusal', END);

export const embeddedAgentGraph = workflow.compile({ checkpointer: memory });
