const rawApiUrl = import.meta.env.VITE_API_URL || '/api/v1';
const BACKEND_API_BASE = rawApiUrl.endsWith('/api/v1')
  ? rawApiUrl
  : (rawApiUrl.startsWith('http') ? `${rawApiUrl.replace(/\/$/, '')}/api/v1` : rawApiUrl);

const VITE_AI_URL = import.meta.env.VITE_AI_SERVICE_URL;
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const DIRECT_AI_URL = VITE_AI_URL || (isLocal ? 'http://localhost:5002' : null);

export const aiApi = {
  /**
   * Send chat message to LangGraph AI Agent
   */
  async sendMessage(message, threadId = 'user-session', userContext = {}) {
    // Attempt 1: If direct AI microservice URL is configured/available, try direct call
    if (DIRECT_AI_URL) {
      try {
        const res = await fetch(`${DIRECT_AI_URL}/api/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, threadId, userContext }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        // Fallback to backend proxy
      }
    }

    // Attempt 2: Through backend API (/api/v1/ai/chat)
    try {
      const res = await fetch(`${BACKEND_API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, threadId, userContext }),
      });
      if (res.ok) {
        return await res.json();
      }
      const data = await res.json().catch(() => ({}));
      if (data?.reply) return data;
    } catch (error) {
      console.error('[AI Service API Error]:', error);
    }

    return {
      success: false,
      reply: "I am having trouble connecting to the AI inference service. Please verify your backend server or AI microservice is active.",
      products: [],
      isOnTopic: true,
    };
  },

  /**
   * Get quick suggested prompt questions
   */
  async getQuickPrompts() {
    if (DIRECT_AI_URL) {
      try {
        const res = await fetch(`${DIRECT_AI_URL}/api/ai/quick-prompts`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    try {
      const res = await fetch(`${BACKEND_API_BASE}/ai/quick-prompts`);
      if (res.ok) return await res.json();
    } catch (e) {}

    return {
      prompts: [
        { id: '1', label: '🔥 Best Sellers', query: 'Show me the highest rated trending products right now.' },
        { id: '2', label: '🎧 Audio & Gadgets', query: 'Find premium wireless audio and headphones.' },
        { id: '3', label: '🏢 Explore Stores', query: 'Which verified vendor stores are open today?' },
        { id: '4', label: '🛡️ Escrow & Protection', query: 'How does the MarketPulse ledger and escrow protection work?' },
        { id: '5', label: '📦 Track My Orders', query: 'Check the shipping status of my recent orders.' },
      ]
    };
  },

  /**
   * Health check for AI engine
   */
  async checkHealth() {
    if (DIRECT_AI_URL) {
      try {
        const res = await fetch(`${DIRECT_AI_URL}/api/ai/health`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    try {
      const res = await fetch(`${BACKEND_API_BASE}/ai/health`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return { status: 'offline' };
  }
};
