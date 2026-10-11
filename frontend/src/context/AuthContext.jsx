import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('campus_token') || localStorage.getItem('mp_token');
    if (token) {
      api.getMe()
        .then((res) => {
          if (res.success) {
            setUser(res.user);
          } else {
            localStorage.removeItem('campus_token');
            localStorage.removeItem('mp_token');
            setUser(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('campus_token');
          localStorage.removeItem('mp_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      if (res.success) {
        localStorage.setItem('campus_token', res.token);
        setUser(res.user);
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const demoLogin = async (role = 'STUDENT', email = null) => {
    try {
      const res = await api.demoLogin(role, email);
      if (res.success) {
        localStorage.setItem('campus_token', res.token);
        setUser(res.user);
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const register = async (nameOrPayload, email, password, role) => {
    try {
      const payload = typeof nameOrPayload === 'object'
        ? nameOrPayload
        : { name: nameOrPayload, email, password, role };
      const res = await api.register(payload);
      if (res.success) {
        localStorage.setItem('campus_token', res.token);
        setUser(res.user);
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('campus_token');
    localStorage.removeItem('mp_token');
    localStorage.removeItem('mp_cart');
    setUser(null);
  };

  // Refresh user data (e.g., after profile update or order placed)
  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, demoLogin, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
