import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { Product } from './models/index.js';
import { ChatGroq } from '@langchain/groq';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// Initialize MongoDB connection
connectDB();

// LLM Instance (Groq Llama 3.3) if API key is provided
let groqModel = null;
if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'mock_key_or_groq_api_key') {
  try {
    groqModel = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      modelName: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      maxTokens: 512,
    });
  } catch (err) {
    console.warn('[AI Service] Groq model initialization skipped:', err.message);
  }
}

/**
 * Health Check Endpoint
 */
app.get(['/health', '/api/ai/health'], (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CampusExchange AI Product Discovery Service',
    engine: groqModel ? 'Groq Llama 3.3 + MongoDB' : 'Heuristic NLP + MongoDB',
    timestamp: new Date().toISOString(),
    hasGroqKey: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'mock_key_or_groq_api_key'),
  });
});

/**
 * Suggested Student Quick Prompts
 */
app.get(['/quick-prompts', '/api/ai/quick-prompts'], (req, res) => {
  res.json({
    prompts: [
      { id: '1', label: '🧮 Calculator under ₹800', query: 'Find a scientific calculator under ₹800.' },
      { id: '2', label: '🚲 Campus Bicycle', query: 'Find me a bicycle under ₹4000 for campus commuting.' },
      { id: '3', label: '🎓 Graduating Student Clearance', query: 'Show items being sold by graduating students leaving hostel.' },
      { id: '4', label: '💻 Coding Monitor', query: 'Find an external monitor in Like New condition for programming.' },
      { id: '5', label: '📚 Engineering Books', query: 'Find engineering textbooks and notes for semester exams.' },
    ],
  });
});

/**
 * Natural Language Product Discovery Endpoint
 * Flow:
 * 1. Extract search parameters (keyword, category, maxPrice, condition)
 * 2. Query MongoDB for AVAILABLE items
 * 3. Generate concise, friendly student response
 */
app.post(['/search', '/api/ai/search', '/chat', '/api/ai/chat'], async (req, res) => {
  try {
    const { message, query } = req.body;
    const userQuery = (message || query || '').trim();

    if (!userQuery) {
      return res.status(400).json({ success: false, message: 'Query string is required.' });
    }

    // --- STEP 1: Parameter Extraction ---
    let keyword = '';
    let category = '';
    let maxPrice = null;
    let condition = '';

    // Regex extraction for maxPrice (e.g. "under 30000", "under ₹800", "< 5000")
    const priceMatch = userQuery.match(/(?:under|below|less than|within|<=|<)\s*₹?\s*(\d+)/i) ||
                       userQuery.match(/₹\s*(\d+)/);
    if (priceMatch && priceMatch[1]) {
      maxPrice = parseInt(priceMatch[1], 10);
    }

    // Heuristic category mapping
    const lower = userQuery.toLowerCase();
    if (lower.includes('calc')) category = 'Calculators';
    else if (lower.includes('book') || lower.includes('textbook')) category = 'Books';
    else if (lower.includes('monitor') || lower.includes('laptop') || lower.includes('headphone')) category = 'Electronics';
    else if (lower.includes('cycle') || lower.includes('bike') || lower.includes('racket') || lower.includes('sport')) category = 'Sports equipment';
    else if (lower.includes('chair') || lower.includes('table') || lower.includes('desk') || lower.includes('bed')) category = 'Furniture';
    else if (lower.includes('note') || lower.includes('revision') || lower.includes('gate')) category = 'Notes/study material';

    // Heuristic condition mapping
    if (lower.includes('new') || lower.includes('pristine')) condition = 'Like New';

    // Meaningful keywords extraction
    const stopWords = new Set(['i', 'need', 'want', 'looking', 'for', 'a', 'an', 'the', 'under', 'below', 'used', 'second', 'hand', 'in', 'at', 'with', 'campus', 'college', 'me', 'find', 'show']);
    const tokens = lower
      .replace(/[^a-z0-9 ]/g, '')
      .split(' ')
      .filter((t) => t.length > 2 && isNaN(t) && !stopWords.has(t));
    keyword = tokens[0] || '';

        // --- STEP 2: Product Catalog Search ---
    let products = [];
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const filter = { status: 'AVAILABLE' };
      if (maxPrice) filter.price = { $lte: maxPrice };
      if (category) filter.category = new RegExp(category, 'i');
      if (tokens.length > 0) {
        const regexArray = tokens.map((t) => new RegExp(t, 'i'));
        filter.$or = [
          { title: { $in: regexArray } },
          { description: { $in: regexArray } },
          { category: { $in: regexArray } },
        ];
      }

      products = await Product.find(filter)
        .populate('seller', 'name hostel college')
        .limit(6)
        .lean();

      if (products.length === 0 && (category || tokens.length > 0)) {
        const relaxedFilter = { status: 'AVAILABLE' };
        if (maxPrice) relaxedFilter.price = { $lte: maxPrice };
        if (tokens.length > 0) relaxedFilter.title = new RegExp(tokens[0], 'i');
        products = await Product.find(relaxedFilter)
          .populate('seller', 'name hostel college')
          .limit(4)
          .lean();
      }
    } else {
      // Query backend REST endpoint if direct DB connection not active
      try {
        const queryParams = new URLSearchParams({
          search: keyword,
          ...(category ? { category } : {}),
          ...(maxPrice ? { maxPrice: String(maxPrice) } : {}),
          limit: '6',
        });
        const resp = await fetch(`${backendUrl}/api/products?${queryParams}`);
        if (resp.ok) {
          const data = await resp.json();
          products = data.products || [];
        }
      } catch (backendFetchErr) {
        console.warn('[AI Service] Backend fallback fetch failed:', backendFetchErr.message);
      }
    }

    // --- STEP 3: Response Generation ---
    let reply = '';

    if (groqModel && products.length > 0) {
      try {
        const prompt = `You are CampusExchange AI, helping a student find campus marketplace listings.
User query: "${userQuery}"
Available matching products found in database:
${JSON.stringify(products.map(p => ({ title: p.title, price: `₹${p.price}`, condition: p.condition, location: p.pickupLocation })))}

Write a friendly 1-2 sentence response summarizing these available items for the student. Mention prices in ₹. Do not invent products.`;

        const aiResponse = await groqModel.invoke(prompt);
        reply = aiResponse.content;
      } catch (err) {
        // Fall back to clean templated reply
        reply = `Found ${products.length} available campus listing${products.length > 1 ? 's' : ''} matching your request:`;
      }
    } else if (products.length > 0) {
      reply = `Found ${products.length} available campus listing${products.length > 1 ? 's' : ''} matching your search:`;
    } else {
      reply = `I couldn't find any available campus listings matching "${userQuery}" at the moment. You can browse all items in the Marketplace or check back as graduating students post new listings!`;
    }

    res.json({
      success: true,
      query: userQuery,
      extracted: { keyword, category, maxPrice, condition },
      reply,
      products,
    });
  } catch (error) {
    console.error('[AI Service Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process product discovery query.',
      products: [],
    });
  }
});

// Start AI Microservice
app.listen(PORT, () => {
  console.log(`🚀 [CampusExchange AI Microservice] running on http://localhost:${PORT}`);
  console.log(`🔍 Purpose: Natural language second-hand product discovery`);
});
