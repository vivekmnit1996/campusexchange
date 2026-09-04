import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import {
  Store,
  Star,
  Plus,
  Minus,
  ArrowLeft,
  ShieldCheck,
  Package,
  Heart,
  CheckCircle2,
} from 'lucide-react';

export const VendorStoreView = ({ storeSlug, onBack, onSelectProduct }) => {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addedToast, setAddedToast] = useState(null);

  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true);
      try {
        const res = await api.getStore(storeSlug);
        if (res.success) {
          setStoreData(res);
        }
      } catch (err) {
        console.error('Fetch store failed:', err);
      } finally {
        setLoading(false);
      }
    };
    if (storeSlug) fetchStore();
  }, [storeSlug]);

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedToast(product.title);
    setTimeout(() => setAddedToast(null), 2500);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pop-in">
        <div className="bg-white border-3 border-black rounded-3xl p-8 h-48 animate-pulse shadow-brutal" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border-3 border-black rounded-2xl p-4 h-64 animate-pulse shadow-brutal" />
          ))}
        </div>
      </div>
    );
  }

  if (!storeData?.store) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center bg-white border-3 border-black rounded-3xl p-8 shadow-brutal space-y-4">
        <Store className="w-12 h-12 text-black mx-auto" />
        <h2 className="text-lg font-display font-black text-black">Store Not Found</h2>
        <button onClick={onBack} className="neo-btn-primary text-xs">
          Return to Marketplace
        </button>
      </div>
    );
  }

  const { store, products, productsCount } = storeData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pop-in">
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FEF08A] text-black font-display font-bold px-5 py-3 rounded-2xl shadow-brutal-xl flex items-center space-x-2.5 border-3 border-black animate-pop-in">
          <CheckCircle2 className="w-5 h-5 text-black" />
          <span className="text-xs">Added <span className="underline">"{addedToast}"</span> to cart!</span>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={onBack}
        className="neo-btn-secondary text-xs flex items-center space-x-1.5"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Stores</span>
      </button>

      {/* Store Banner & Bio */}
      <div className="bg-[#C4B5FD] border-3 border-black rounded-3xl p-6 sm:p-8 shadow-brutal-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-white border-2.5 border-black shadow-brutal flex items-center justify-center text-black flex-shrink-0">
              <Store className="w-8 h-8 text-black" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center space-x-2.5">
                <h1 className="text-2xl sm:text-3xl font-display font-black text-black tracking-tight">{store.name}</h1>
                <span className="px-2.5 py-0.5 rounded-lg bg-[#6EE7B7] border-2 border-black text-xs font-mono font-black shadow-xs">
                  Verified Merchant
                </span>
              </div>
              <p className="text-xs font-bold text-black/80 max-w-xl leading-relaxed">
                {store.description || 'Authorized specialty creator merchant providing direct warranty and expedited fulfillment.'}
              </p>
              <div className="flex items-center space-x-4 text-xs text-black font-mono font-bold pt-1">
                <div className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#FEF08A] border border-black">
                  <Star className="w-3.5 h-3.5 fill-current text-black" />
                  <span>{store.rating || 4.9}</span>
                  <span className="opacity-70">(Store Rating)</span>
                </div>
                <span>•</span>
                <span>{productsCount} Active Listings</span>
                <span>•</span>
                <span>Owner: {store.owner?.name}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2.5 border-black shadow-brutal flex items-center space-x-3 self-start sm:self-auto">
            <ShieldCheck className="w-6 h-6 text-black" />
            <div className="text-xs font-bold">
              <div className="font-display font-black text-black">Direct Merchant Warranty</div>
              <div className="text-[10px] text-black/70 font-mono">Orders split & fulfilled directly</div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Catalog */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div>
            <h2 className="text-lg font-display font-black text-black">Store Catalog</h2>
            <p className="text-xs font-bold text-black/70">Items exclusively sold by {store.name}</p>
          </div>
          <span className="text-xs font-mono font-black bg-white px-3 py-1 rounded-xl border-2 border-black shadow-xs">{products.length} Items</span>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#161A2B] border-3 border-black rounded-3xl p-6 shadow-brutal space-y-2 text-black dark:text-white">
            <Package className="w-10 h-10 text-black dark:text-[#FFE600] mx-auto" />
            <p className="text-xs font-bold">No active products listed by this store yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const inWish = isInWishlist(product._id);
              return (
                <div
                  key={product._id}
                  onClick={() => onSelectProduct(product)}
                  className="bg-white dark:bg-[#161A2B] border-3 border-black rounded-3xl shadow-brutal dark:shadow-[5px_5px_0px_0px_#000000,0_0_0_1.5px_rgba(255,255,255,0.18)] hover:shadow-brutal-lg dark:hover:shadow-[7px_7px_0px_0px_#000000,0_0_20px_rgba(0,240,255,0.35)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition duration-150 cursor-pointer flex flex-col justify-between overflow-hidden group text-black dark:text-white"
                >
                  <div className="relative h-52 w-full bg-[#F3F4F6] dark:bg-[#20253B] overflow-hidden border-b-3 border-black">
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />

                    {/* Wishlist Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product);
                      }}
                      className={`absolute top-3 right-3 p-2 rounded-xl border-2 border-black transition shadow-brutal-sm ${
                        inWish
                          ? 'bg-[#FF6B97] dark:bg-[#FF2A85] text-white'
                          : 'bg-white dark:bg-[#252A42] text-black dark:text-white hover:bg-[#FF6B97] hover:text-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${inWish ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold text-black mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-[#C4B5FD] dark:bg-[#B026FF] dark:text-white border border-black uppercase tracking-wider font-black">{product.category}</span>
                        <div className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#FEF08A] dark:bg-[#FFE600] text-black border border-black font-black">
                          <Star className="w-3 h-3 text-black fill-current" />
                          <span>{product.rating}</span>
                        </div>
                      </div>

                      <h3 className="text-base font-display font-black text-black dark:text-white line-clamp-1 mt-2">
                        {product.title}
                      </h3>
                      <p className="text-xs font-semibold text-black/70 dark:text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t-2 border-black flex items-center justify-between">
                      <div>
                        <span className="text-lg font-black text-black dark:text-[#FFE600] font-mono">${product.price.toFixed(2)}</span>
                        <div className="text-[10px] font-mono font-bold text-black/70 dark:text-slate-300">
                          Stock: <span className={product.stock > 0 ? 'text-black dark:text-[#00FF87] font-black' : 'text-rose-600 font-black'}>{product.stock} units</span>
                        </div>
                      </div>

                    {/* Dynamic Add / Quantity Stepper Button */}
                    {(() => {
                      const cartQty = getItemQuantity(product._id);
                      if (cartQty > 0) {
                        return (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center bg-[#FEF08A] dark:bg-[#FFE600] border-2 border-black rounded-xl shadow-brutal-sm text-black font-black"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(product._id, cartQty - 1);
                              }}
                              className="px-2 py-1.5 hover:bg-[#FDE047] dark:hover:bg-[#FFF500] rounded-l-lg transition cursor-pointer"
                              title="Decrease quantity (-1)"
                            >
                              <Minus className="w-3.5 h-3.5 text-black stroke-[3]" />
                            </button>
                            <span className="px-2 font-mono text-xs font-black text-black select-none">
                              {cartQty}
                            </span>
                            <button
                              type="button"
                              disabled={cartQty >= product.stock}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (cartQty < product.stock) {
                                  addToCart(product, 1);
                                }
                              }}
                              className="px-2 py-1.5 hover:bg-[#FDE047] dark:hover:bg-[#FFF500] disabled:opacity-30 rounded-r-lg transition cursor-pointer"
                              title="Add more (+1)"
                            >
                              <Plus className="w-3.5 h-3.5 text-black stroke-[3]" />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <button
                          disabled={product.stock === 0}
                          onClick={(e) => handleAddToCart(product, e)}
                          className={`px-4 py-2 rounded-xl text-xs font-display font-black border-2 border-black transition ${
                            product.stock > 0
                              ? 'bg-[#FEF08A] dark:bg-[#FFE600] text-black hover:bg-[#FDE047] dark:hover:bg-[#FFF500] shadow-brutal-sm hover:translate-x-[-1px] text-black'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border-slate-400'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      );
                    })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
