const rawApiUrl = import.meta.env.VITE_API_URL || '/api';
const BACKEND_API_BASE = rawApiUrl.startsWith('http')
  ? (rawApiUrl.includes('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`)
  : '/api';

export const aiApi = {
  /**
   * Send natural-language query to AI Service via backend
   */
  async sendMessage(message, threadId = 'user-session', userContext = {}) {
    try {
      const res = await fetch(`${BACKEND_API_BASE}/ai/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, query: message, threadId, userContext }),
      });

      if (res.ok) {
        return await res.json();
      }

      const data = await res.json().catch(() => ({}));
      if (data?.reply) return data;
    } catch (error) {
      console.warn('[AI Service API Call Error]:', error.message);
    }

    return {
      success: false,
      reply: "I am having temporary trouble connecting to the campus discovery engine. You can browse all items directly in the Marketplace!",
      products: [],
      isOnTopic: true,
    };
  },

  /**
   * Get student quick prompts
   */
  async getQuickPrompts() {
    try {
      const res = await fetch(`${BACKEND_API_BASE}/ai/quick-prompts`);
      if (res.ok) return await res.json();
    } catch (e) {}

    return {
      prompts: [
        { id: '1', label: '🧮 Calculator under ₹800', query: 'Find a scientific calculator under ₹800.' },
        { id: '2', label: '🚲 Campus Bicycle', query: 'Find me a bicycle under ₹4000 for campus commuting.' },
        { id: '3', label: '🎓 Graduating Student Clearance', query: 'Show items being sold by graduating students leaving hostel.' },
        { id: '4', label: '💻 Coding Monitor', query: 'Find an external monitor in Like New condition for programming.' },
        { id: '5', label: '📚 Engineering Books', query: 'Find engineering textbooks and notes for semester exams.' },
      ]
    };
  },

  /**
   * Health check for AI service
   */
  async checkHealth() {
    try {
      const res = await fetch(`${BACKEND_API_BASE}/ai/health`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return { status: 'offline' };
  }
};
