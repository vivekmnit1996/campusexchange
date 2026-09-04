import express from 'express';
import { HumanMessage } from '@langchain/core/messages';
import { embeddedAgentGraph } from '../services/aiAgentService.js';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

// Chat route: Tries external microservice first (if configured), otherwise executes embedded LangGraph agent directly
router.post('/chat', async (req, res) => {
  const { message, threadId = 'default-session', userContext = {} } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Valid message is required' });
  }

  // Option 1: External Microservice Proxy
  if (AI_SERVICE_URL && AI_SERVICE_URL.startsWith('http')) {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(response.status).json(data);
      }
    } catch (error) {
      console.warn(`[AI Proxy] Microservice at ${AI_SERVICE_URL} unreachable, falling back to embedded LangGraph agent.`);
    }
  }

  // Option 2: Embedded LangGraph Agent
  try {
    const config = {
      configurable: { thread_id: threadId },
    };

    const initialInput = {
      messages: [new HumanMessage(message.trim())],
      userContext,
    };

    const finalState = await embeddedAgentGraph.invoke(initialInput, config);
    const lastMsg = finalState.messages[finalState.messages.length - 1];
    const replyText = typeof lastMsg.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg.content);

    return res.json({
      success: true,
      threadId,
      isOnTopic: finalState.isOnTopic ?? true,
      intent: finalState.intent || 'general',
      reply: replyText,
      products: finalState.recommendedProducts || [],
    });
  } catch (err) {
    console.error('[Embedded AI Agent Error]:', err);
    return res.status(500).json({
      success: false,
      reply: "I am having temporary trouble with the AI inference engine. Please check back in a moment.",
      products: [],
    });
  }
});

// Quick prompts route
router.get('/quick-prompts', (req, res) => {
  res.json({
    prompts: [
      { id: '1', label: '🔥 Best Sellers', query: 'Show me the highest rated trending products right now.' },
      { id: '2', label: '🎧 Audio & Gadgets', query: 'Find premium wireless audio and headphones.' },
      { id: '3', label: '🏢 Explore Stores', query: 'Which verified vendor stores are open today?' },
      { id: '4', label: '🛡️ Escrow & Protection', query: 'How does the MarketPulse ledger and escrow protection work?' },
      { id: '5', label: '📦 Track My Orders', query: 'Check the shipping status of my recent orders.' },
    ],
  });
});

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    mode: AI_SERVICE_URL ? `proxy -> ${AI_SERVICE_URL}` : 'embedded-langgraph-groq',
    hasGroqKey: Boolean(process.env.GROQ_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

export default router;
