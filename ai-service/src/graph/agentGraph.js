import { StateGraph, MemorySaver, START, END } from '@langchain/langgraph';
import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { AgentState } from './state.js';
import { domainGuardrailNode } from './guardrails.js';
import { searchProductsTool, getStoreInfoTool, getUserOrdersTool, getMarketplacePolicyFAQ } from './tools.js';

// Groq Main Synthesizer Model
const synthesizerModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  modelName: 'openai/gpt-oss-120b',
  temperature: 0.3,
  maxTokens: 1024,
});

/**
 * Tool Execution Node: Gathers live data from MongoDB
 */
async function toolExecutionNode(state) {
  const { intent, retrievedData = {}, userContext = {} } = state;
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  const queryText = typeof lastMessage.content === 'string' ? lastMessage.content : '';
  const searchKeywords = retrievedData.searchKeywords || queryText;

  let products = [];
  let stores = [];
  let orders = null;
  let policy = null;

  try {
    if (intent === 'product_search' || intent === 'product_recommendation' || intent === 'marketplace_general') {
      products = await searchProductsTool({ query: searchKeywords, limit: 6 });
      // If zero results for specific query, fetch top featured/rated products as fallback
      if (products.length === 0) {
        products = await searchProductsTool({ query: '', limit: 4 });
      }
    }

    if (intent === 'store_inquiry' || queryText.toLowerCase().includes('store') || queryText.toLowerCase().includes('vendor')) {
      stores = await getStoreInfoTool({ query: searchKeywords });
    }

    if (intent === 'order_tracking' || queryText.toLowerCase().includes('order') || queryText.toLowerCase().includes('package')) {
      if (userContext?.id || userContext?._id || userContext?.email) {
        orders = await getUserOrdersTool({ 
          userId: userContext.id || userContext._id, 
          userEmail: userContext.email 
        });
      } else {
        orders = { notice: 'User is not logged in. Prompt user to sign in to see specific order details.' };
      }
    }

    if (intent === 'policy_inquiry' || queryText.toLowerCase().includes('escrow') || queryText.toLowerCase().includes('shipping') || queryText.toLowerCase().includes('refund') || queryText.toLowerCase().includes('ledger')) {
      policy = getMarketplacePolicyFAQ();
    }
  } catch (err) {
    console.error('[ToolExecutionNode Error]:', err.message);
  }

  return {
    retrievedData: {
      ...retrievedData,
      products,
      stores,
      orders,
      policy,
    },
    recommendedProducts: products,
  };
}

/**
 * Refusal Node for Out-Of-Scope Queries
 */
async function refusalNode(state) {
  const refusalMessage = state.refusalReason || 
    "I am the MarketPulse Marketplace AI Assistant. I can only answer questions related to MarketPulse products, vendor stores, order status, shipping, checkout, and marketplace policies. How can I help you find something on our store today?";
  
  return {
    messages: [new AIMessage(refusalMessage)],
    recommendedProducts: [],
  };
}

/**
 * Response Generation Node: Synthesizes final response with Groq LLM
 */
async function responseSynthesisNode(state) {
  const { messages, retrievedData = {}, userContext = {} } = state;
  const products = retrievedData.products || [];
  const stores = retrievedData.stores || [];
  const orders = retrievedData.orders || null;
  const policy = retrievedData.policy || null;

  const systemInstructions = `
You are MarketPulse AI, an intelligent, energetic shopping assistant and platform guide embedded within the MarketPulse Multi-Vendor Marketplace.

### STRICT SCOPE RULE:
- You ONLY provide information regarding MarketPulse products, vendor stores, orders, checkout, shipping, escrow ledger, and platform navigation.
- If the user tries to divert the conversation to off-topic subjects (politics, homework, general trivia, unrelated code), politely redirect them back to MarketPulse.

### CURRENT LIVE MARKETPLACE CONTEXT:
${userContext?.name ? `- Authenticated User: ${userContext.name} (${userContext.email || 'Customer'}, Role: ${userContext.role || 'customer'})` : '- User: Guest (not logged in)'}

${products.length > 0 ? `
[AVAILABLE MARKETPLACE PRODUCTS FOUND]:
${JSON.stringify(products.map(p => ({
  id: p.id,
  title: p.title,
  price: `$${p.price}`,
  rating: `${p.rating} ★ (${p.numReviews} reviews)`,
  category: p.category,
  store: p.storeName,
  stock: p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'
})), null, 2)}
` : '[No specific product matches found in catalog]'}

${stores.length > 0 ? `
[AVAILABLE VENDOR STORES]:
${JSON.stringify(stores.map(s => ({ name: s.name, slug: s.slug, description: s.description })), null, 2)}
` : ''}

${orders ? `
[USER ORDERS DATA]:
${JSON.stringify(orders, null, 2)}
` : ''}

${policy ? `
[MARKETPLACE POLICIES & ARCHITECTURE]:
${policy}
` : ''}

### TONE & FORMATTING:
- Formatting: Use bold highlights, bullet points, clean pricing tags (e.g. **$99.00**), and concise paragraphs.
- Always be helpful, responsive, and recommend products that best match the buyer's query.
- When mentioning products, reference their title and key features. (Interactive product cards will also be rendered in the UI directly).
`;

  try {
    const chatHistory = messages.map(m => {
      if (m._getType && m._getType() === 'human') {
        return new HumanMessage(m.content);
      } else if (m._getType && m._getType() === 'ai') {
        return new AIMessage(m.content);
      }
      return m;
    });

    const response = await synthesizerModel.invoke([
      new SystemMessage(systemInstructions),
      ...chatHistory,
    ]);

    return {
      messages: [response],
      recommendedProducts: products,
    };
  } catch (error) {
    console.error('[ResponseSynthesisNode Error]:', error.message);
    return {
      messages: [new AIMessage("I'm having a brief issue connecting to the inference engine. Here are some top products you might like from our catalog! Please try again in a moment.")],
      recommendedProducts: products,
    };
  }
}

/**
 * Conditional router edge based on guardrails
 */
function checkGuardrailRoute(state) {
  if (state.isOnTopic === false) {
    return 'refusal';
  }
  return 'tools';
}

// Build the LangGraph Workflow
const workflow = new StateGraph(AgentState)
  .addNode('guardrail', domainGuardrailNode)
  .addNode('tools', toolExecutionNode)
  .addNode('refusal', refusalNode)
  .addNode('synthesis', responseSynthesisNode)
  .addEdge(START, 'guardrail')
  .addConditionalEdges('guardrail', checkGuardrailRoute, {
    refusal: 'refusal',
    tools: 'tools',
  })
  .addEdge('tools', 'synthesis')
  .addEdge('synthesis', END)
  .addEdge('refusal', END);

// Checkpointer memory for maintaining multi-turn conversations
export const memory = new MemorySaver();
export const agentGraph = workflow.compile({ checkpointer: memory });
