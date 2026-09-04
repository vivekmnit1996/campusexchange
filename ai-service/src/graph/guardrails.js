import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const guardrailModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  modelName: 'openai/gpt-oss-20b',
  temperature: 0.0,
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
Return a JSON object ONLY with the following schema:
{
  "isOnTopic": true | false,
  "intent": "product_search" | "product_recommendation" | "store_inquiry" | "order_tracking" | "policy_inquiry" | "marketplace_general" | "off_topic",
  "reason": "Brief reason explaining the categorization",
  "searchKeywords": "Extracted search terms if relevant (e.g. 'mechanical keyboard under 100', 'headphones', 'store techzone')"
}
`;

export async function domainGuardrailNode(state) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  const queryText = typeof lastMessage.content === 'string' 
    ? lastMessage.content 
    : JSON.stringify(lastMessage.content);

  // Fast pre-filter for simple greetings
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
    const response = await guardrailModel.invoke([
      new SystemMessage(MARKETPLACE_SCOPE_PROMPT),
      new HumanMessage(`User query: "${queryText}"\nEvaluate domain relevance. JSON ONLY:`),
    ]);

    const content = response.content.toString();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        isOnTopic: true,
        intent: 'product_search',
        refusalReason: '',
      };
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
    console.error('[Guardrail Error]:', error.message);
    // Graceful fallback to allow query in case of guardrail transient error
    return {
      isOnTopic: true,
      intent: 'marketplace_general',
      refusalReason: '',
    };
  }
}
