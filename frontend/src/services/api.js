const rawApiUrl = import.meta.env.VITE_API_URL || '/api/v1';
const API_BASE = rawApiUrl.endsWith('/api/v1')
  ? rawApiUrl
  : (rawApiUrl.startsWith('http') ? `${rawApiUrl.replace(/\/$/, '')}/api/v1` : rawApiUrl);

const fetchWithTimeout = async (url, options = {}, timeoutMs = 20000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Connection timed out. The backend server might be waking up, please try again in a few seconds.');
    }
    throw error;
  }
};

const getHeaders = (idempotencyKey = null) => {
  const token = localStorage.getItem('mp_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  return headers;
};

export const api = {
  // Auth
  async login(email, password) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, message: data.message || 'Invalid email or password' };
      }
      return data;
    } catch (err) {
      return { success: false, message: err.message || 'Network error connecting to backend' };
    }
  },

  async register(name, email, password, role, storeName) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: email.trim().toLowerCase(), password, role, storeName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, message: data.message || 'Registration failed' };
      }
      return data;
    } catch (err) {
      return { success: false, message: err.message || 'Network error connecting to backend' };
    }
  },

  async getMe() {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/auth/me`, {
        headers: getHeaders(),
      }, 8000);
      return res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // Wishlist
  async toggleWishlist(productId) {
    const res = await fetch(`${API_BASE}/auth/wishlist/${productId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  async getWishlist() {
    const res = await fetch(`${API_BASE}/auth/wishlist`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  // Address Book
  async addSavedAddress(addressData) {
    const res = await fetch(`${API_BASE}/auth/addresses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(addressData),
    });
    return res.json();
  },

  async deleteSavedAddress(addressId) {
    const res = await fetch(`${API_BASE}/auth/addresses/${addressId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Products
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/products?${query}`);
    return res.json();
  },

  async getProductById(id) {
    const res = await fetch(`${API_BASE}/products/${id}`);
    return res.json();
  },

  async createProduct(data) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateProduct(id, data) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async createProductReview(productId, reviewData) {
    const res = await fetch(`${API_BASE}/products/${productId}/reviews`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reviewData),
    });
    return res.json();
  },

  // Stores
  async getStore(identifier) {
    const res = await fetch(`${API_BASE}/stores/${identifier}`);
    return res.json();
  },

  async getAllStores() {
    const res = await fetch(`${API_BASE}/stores`);
    return res.json();
  },

  // Orders & Checkout
  async createOrder(orderData, idempotencyKey = null) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getHeaders(idempotencyKey),
      body: JSON.stringify(orderData),
    });
    const data = await res.json();
    return {
      status: res.status,
      cacheLookup: res.headers.get('X-Cache-Lookup') || 'NONE',
      data,
    };
  },

  async getMyOrders() {
    const res = await fetch(`${API_BASE}/orders/mine`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async cancelOrder(orderId, reason = 'Customer requested cancellation') {
    const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    return res.json();
  },

  // Vendor
  async getVendorDashboard() {
    const res = await fetch(`${API_BASE}/vendor/dashboard`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async getVendorSubOrders() {
    const res = await fetch(`${API_BASE}/vendor/sub-orders`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async updateSubOrderStatus(orderId, subOrderId, data) {
    const res = await fetch(`${API_BASE}/vendor/orders/${orderId}/sub-orders/${subOrderId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Analytics
  async getPlatformAnalytics() {
    const res = await fetch(`${API_BASE}/analytics/platform`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async getVendorAnalytics() {
    const res = await fetch(`${API_BASE}/analytics/vendor`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  // Webhooks
  async sendWebhook(payload, signature) {
    const res = await fetch(`${API_BASE}/webhooks/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MarketPulse-Signature': signature,
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getWebhookLogs() {
    const res = await fetch(`${API_BASE}/webhooks/logs`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  // DevTools
  async simulateConcurrency(initialStock = 3, concurrentRequests = 20) {
    const res = await fetch(`${API_BASE}/devtools/simulate-concurrency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initialStock, concurrentRequests }),
    });
    return res.json();
  },

  async generateSignedWebhook(orderNumber, amount, tamperSignature = false) {
    const res = await fetch(`${API_BASE}/devtools/emit-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber, amount, tamperSignature }),
    });
    return res.json();
  },
};
