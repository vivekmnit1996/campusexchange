import { Product } from '../models/Product.js';

export const searchAI = async (req, res, next) => {
  const { message, query } = req.body;
  const userQuery = (message || query || '').trim();

  if (!userQuery) {
    return res.status(400).json({ success: false, message: 'Query or message string is required.' });
  }

  const AI_SERVICE_URL = process.env.AI_SERVICE_URL !== undefined ? process.env.AI_SERVICE_URL : 'http://localhost:5002/api/ai';

  // 1. Attempt small AI microservice with 3.5s timeout
  if (AI_SERVICE_URL && AI_SERVICE_URL.startsWith('http')) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const targetEndpoint = AI_SERVICE_URL.endsWith('/search') || AI_SERVICE_URL.endsWith('/chat')
        ? AI_SERVICE_URL
        : `${AI_SERVICE_URL.replace(/\/$/, '')}/search`;

      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userQuery, query: userQuery }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return res.json({
          success: true,
          reply: data.reply || data.response,
          products: data.products || [],
          source: 'ai-microservice',
        });
      }
    } catch (err) {
      console.warn('[AI Proxy] AI Service unavailable or timed out, executing resilient database fallback.');
    }
  }

  // 2. Resilient Database Fallback: Tokenize query and search available items
  try {
    const cleanTokens = userQuery
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(' ')
      .filter((w) => w.length > 2 && isNaN(w) && !['need', 'want', 'find', 'used', 'under', 'with', 'from', 'show', 'looking'].includes(w));

    let priceFilter = null;
    const priceMatch = userQuery.match(/(?:under|below|less than|<=|<)\s*₹?\s*(\d+)/i) ||
                       userQuery.match(/₹\s*(\d+)/);
    if (priceMatch && priceMatch[1]) {
      priceFilter = Number(priceMatch[1]);
    }

    const filter = { status: 'AVAILABLE' };
    if (priceFilter && priceFilter > 0) {
      filter.price = { $lte: priceFilter };
    }

    if (cleanTokens.length > 0) {
      const orClauses = [];
      for (const token of cleanTokens) {
        const regex = new RegExp(token, 'i');
        orClauses.push({ title: regex }, { description: regex }, { category: regex });
      }
      filter.$or = orClauses;
    }

    let products = await Product.find(filter)
      .populate('seller', 'name hostel college')
      .limit(6)
      .lean();

    // If no exact matches, retrieve newest available items
    if (products.length === 0) {
      products = await Product.find({ status: 'AVAILABLE' })
        .populate('seller', 'name hostel college')
        .limit(4)
        .lean();
    }

    let reply = `Here are campus listings matching "${userQuery}":`;
    if (products.length === 0) {
      reply = `I couldn't find any available listings matching "${userQuery}" right now. Check back soon as students post new items regularly!`;
    }

    res.json({
      success: true,
      reply,
      products,
      source: 'catalog-search-fallback',
    });
  } catch (error) {
    next(error);
  }
};

export const getQuickPrompts = (req, res) => {
  res.json({
    prompts: [
      { id: '1', label: '🧮 Calculator under ₹800', query: 'Find a scientific calculator under ₹800.' },
      { id: '2', label: '🚲 Campus Bicycle', query: 'Find me a bicycle under ₹4000 for campus commuting.' },
      { id: '3', label: '🎓 Graduating Student Clearance', query: 'Show items being sold by graduating students leaving hostel.' },
      { id: '4', label: '💻 Coding Monitor', query: 'Find an external monitor in Like New condition for programming.' },
      { id: '5', label: '📚 Engineering Books', query: 'Find engineering textbooks and notes for semester exams.' },
    ],
  });
};

export const getHealth = (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CampusExchange AI Endpoint',
    timestamp: new Date().toISOString(),
  });
};
