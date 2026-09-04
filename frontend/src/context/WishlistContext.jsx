import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlistIds([]);
      setWishlistProducts([]);
    }
  }, [user]);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await api.getWishlist();
      if (res.success) {
        setWishlistProducts(res.wishlist || []);
        setWishlistIds((res.wishlist || []).map((p) => p._id || p));
      }
    } catch (err) {
      console.error('Fetch wishlist failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (product) => {
    const pId = product._id || product;
    try {
      const res = await api.toggleWishlist(pId);
      if (res.success) {
        if (res.inWishlist) {
          setWishlistIds((prev) => [...prev, pId]);
          setWishlistProducts((prev) => [...prev, product]);
        } else {
          setWishlistIds((prev) => prev.filter((id) => id !== pId));
          setWishlistProducts((prev) => prev.filter((p) => (p._id || p) !== pId));
        }
      }
    } catch (err) {
      console.error('Toggle wishlist error:', err);
    }
  };

  const isInWishlist = (productId) => {
    return wishlistIds.includes(productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistProducts,
        toggleWishlist,
        isInWishlist,
        wishlistCount: wishlistIds.length,
        loading,
        fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
