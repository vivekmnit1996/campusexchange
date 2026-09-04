import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('mp_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('mp_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product, quantity = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.productId === product._id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product._id,
            title: product.title,
            price: product.price,
            quantity,
            image: product.images[0] || '',
            storeId: product.store?._id || product.store,
            storeName: product.store?.name || 'Authorized Store',
            maxStock: product.stock,
          },
        ];
      }
    });
  };

  const removeFromCart = (productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: newQty } : i))
    );
  };

  const clearCart = () => setItems([]);

  // Calculate totals and vendor breakdowns
  const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Group items by vendor store
  const vendorGroups = items.reduce((acc, item) => {
    const storeKey = item.storeId || 'generic';
    if (!acc[storeKey]) {
      acc[storeKey] = {
        storeId: item.storeId,
        storeName: item.storeName,
        items: [],
        subTotal: 0,
      };
    }
    acc[storeKey].items.push(item);
    acc[storeKey].subTotal += item.price * item.quantity;
    return acc;
  }, {});

  const getItemQuantity = (productId) => {
    const item = items.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        getItemQuantity,
        clearCart,
        totalAmount,
        totalItemCount,
        vendorGroups: Object.values(vendorGroups),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
