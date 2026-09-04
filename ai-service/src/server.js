import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { HumanMessage } from '@langchain/core/messages';
import { connectDB } from './config/db.js';
import { agentGraph } from './graph/agentGraph.js';
import { searchProductsTool } from './graph/tools.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Health Check
app.get(['/health', '/api/ai/health'], (req, res) => {
  res.json({
    status: 'healthy',
    service: 'marketpulse-ai-agent-microservice',
    engine: 'LangGraph + Groq Llama 3.3',
    timestamp: new Date().toISOString(),
    hasGroqKey: Boolean(process.env.GROQ_API_KEY),
  });
});

// Quick Recommendations / Suggested Prompts Endpoint
app.get('/api/ai/quick-prompts', (req, res) => {
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

// Chat Endpoint with LangGraph StateGraph Execution
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, threadId = 'default-session', userContext = {} } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Valid message string is required.' });
    }

    const config = {
      configurable: { thread_id: threadId },
    };

    const initialInput = {
      messages: [new HumanMessage(message.trim())],
      userContext,
    };

    const finalState = await agentGraph.invoke(initialInput, config);

    // Extract the latest AI message
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
  } catch (error) {
    console.error('[AI Chat Route Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process AI conversation.',
      details: error.message,
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 [MarketPulse AI Microservice] running on http://localhost:${PORT}`);
  console.log(`🧠 Engine: LangGraph (StateGraph + Checkpointer) powered by Groq Llama 3.3`);
});
