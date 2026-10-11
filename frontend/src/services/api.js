const rawApiUrl = import.meta.env.VITE_API_URL || '/api';
const API_BASE = rawApiUrl.startsWith('http')
  ? (rawApiUrl.includes('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`)
  : '/api';

const getHeaders = () => {
  const token = localStorage.getItem('campus_token') || localStorage.getItem('mp_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export const api = {
  // --- AUTHENTICATION ---
  async login(email, password) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message || 'Network error connecting to backend' };
    }
  },

  async demoLogin(role = 'STUDENT', email = null) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, email }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message || 'Network error connecting to backend' };
    }
  },

  async uploadImage(file) {
    try {
      if (!file) {
        return { success: false, message: 'No image file selected.' };
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          message: 'Unsupported format. Please upload a JPEG, PNG, or WebP image.',
        };
      }
      if (file.size > 5 * 1024 * 1024) {
        return {
          success: false,
          message: 'Image size exceeds the 5MB limit. Please choose a smaller file.',
        };
      }

      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('campus_token') || localStorage.getItem('mp_token');
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      return await res.json();
    } catch (err) {
      return { success: false, message: err.message || 'Image upload failed' };
    }
  },

  async register(registrationData) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message || 'Network error connecting to backend' };
    }
  },

  async getMe() {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/auth/me`, {
        headers: getHeaders(),
      }, 8000);
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async updateProfile(data) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success && json.token) {
        localStorage.setItem('campus_token', json.token);
      }
      return json;
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // --- PRODUCTS ---
  async getProducts(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/products?${query}`);
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message, products: [] };
    }
  },

  async getProductById(id) {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`);
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async createProduct(data) {
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async updateProduct(id, data) {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async deleteProduct(id) {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async getMyListings() {
    try {
      const res = await fetch(`${API_BASE}/products/seller/me`, {
        headers: getHeaders(),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message, products: [] };
    }
  },

  // --- PURCHASE REQUESTS (CAMPUS HAND-OFF) ---
  async reserveItem(productId, pickupLocation = '', notes = '', quantity = 1) {
    try {
      const res = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          productId,
          pickupLocation,
          notes,
          quantity: Math.max(1, parseInt(quantity, 10) || 1),
        }),
      });
      const data = await res.json().catch(() => ({}));
      return {
        status: res.status,
        success: res.ok,
        ...data,
      };
    } catch (err) {
      return { success: false, message: err.message || 'Network error' };
    }
  },

  async getMyPurchases() {
    try {
      const res = await fetch(`${API_BASE}/requests/buyer`, {
        headers: getHeaders(),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message, requests: [] };
    }
  },

  async getSellerRequests() {
    try {
      const res = await fetch(`${API_BASE}/requests/seller`, {
        headers: getHeaders(),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message, requests: [] };
    }
  },

  async acceptReservation(requestId) {
    try {
      const res = await fetch(`${API_BASE}/requests/${requestId}/accept`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async rejectReservation(requestId, reason = '') {
    try {
      const res = await fetch(`${API_BASE}/requests/${requestId}/reject`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ reason }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async completeReservation(requestId) {
    try {
      const res = await fetch(`${API_BASE}/requests/${requestId}/complete`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async cancelReservation(requestId, reason = '') {
    try {
      const res = await fetch(`${API_BASE}/requests/${requestId}/cancel`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ reason }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // Backward compatibility aliases
  async getMyOrders() {
    return this.getMyPurchases();
  },

  async cancelOrder(orderId, reason = '') {
    return this.cancelReservation(orderId, reason);
  },

  // --- ADMIN CONSOLE ---
  async getAdminUsers(page = 1, limit = 20) {
    try {
      const res = await fetch(`${API_BASE}/admin/users?page=${page}&limit=${limit}`, {
        headers: getHeaders(),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message, users: [] };
    }
  },

  async deleteAdminUser(userId) {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async getAdminProducts(page = 1, limit = 20) {
    try {
      const res = await fetch(`${API_BASE}/admin/products?page=${page}&limit=${limit}`, {
        headers: getHeaders(),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message, products: [] };
    }
  },

  async deleteAdminProduct(productId) {
    try {
      const res = await fetch(`${API_BASE}/admin/products/${productId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async getAdminStats() {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: getHeaders(),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async getPlatformAnalytics() {
    return this.getAdminStats();
  },
};
