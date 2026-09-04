import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  X,
  Star,
  Store,
  Plus,
  Minus,
  Truck,
  RotateCcw,
  CheckCircle2,
  MessageSquare,
  Send,
  AlertCircle,
} from 'lucide-react';

export const ProductDetailModal = ({ product: initialProduct, onClose, onOpenStore }) => {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(initialProduct);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'reviews'

  // Review Form State
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Sync state whenever the selected product prop changes
  useEffect(() => {
    if (!initialProduct) {
      setProduct(null);
      return;
    }

    setProduct(initialProduct);
    setActiveTab('details');
    setReviewError(null);
    setReviewSuccess(false);
    setNewComment('');

    let isSubscribed = true;
    if (initialProduct._id) {
      api
        .getProductById(initialProduct._id)
        .then((res) => {
          if (isSubscribed && res?.success && res.product) {
            setProduct(res.product);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch detailed product:', err);
        });
    }

    return () => {
      isSubscribed = false;
    };
  }, [initialProduct]);

  // Support closing on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    if (initialProduct) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [initialProduct, onClose]);

  // If no product is selected, do not render modal
  if (!initialProduct) return null;

  const currentProduct = product || initialProduct;
  if (!currentProduct) return null;

  const reviews = currentProduct.reviews || [];
  const currentStock = currentProduct.stock ?? 0;
  const cartQty = getItemQuantity(currentProduct._id);
  const price = typeof currentProduct.price === 'number' ? currentProduct.price : 0;
  const compareAtPrice = typeof currentProduct.compareAtPrice === 'number' ? currentProduct.compareAtPrice : null;
  const imageSrc =
    currentProduct.images && currentProduct.images.length > 0
      ? currentProduct.images[0]
      : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingReview(true);
    setReviewError(null);
    try {
      const res = await api.createProductReview(currentProduct._id, {
        rating: newRating,
        comment: newComment,
      });

      if (res.success) {
        setProduct(res.product);
        setNewComment('');
        setReviewSuccess(true);
        setTimeout(() => setReviewSuccess(false), 3000);
      } else {
        setReviewError(res.message || 'Failed to submit review');
      }
    } catch (err) {
      setReviewError(err.message || 'Error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-pop-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white dark:bg-[#121522] border-3 border-black rounded-3xl shadow-brutal-xl overflow-hidden max-h-[90vh] flex flex-col z-10 text-black dark:text-white transition-colors">
        {/* Close (Cross) Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-30 p-2 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black text-black dark:text-white hover:bg-[#FF6B97] dark:hover:bg-[#FF2A85] hover:text-white transition shadow-brutal-sm cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tab Headers */}
        <div className="flex border-b-3 border-black bg-[#FEF08A] dark:bg-[#FFE600] px-6 pt-4 gap-3 text-xs font-display font-black text-black">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 px-4 rounded-t-xl transition border-2 border-b-0 border-black cursor-pointer ${
              activeTab === 'details'
                ? 'bg-white dark:bg-[#121522] text-black dark:text-white shadow-xs'
                : 'bg-transparent text-black/70 hover:text-black'
            }`}
          >
            Product Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`pb-2.5 px-4 rounded-t-xl transition border-2 border-b-0 border-black flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-white dark:bg-[#121522] text-black dark:text-white shadow-xs'
                : 'bg-transparent text-black/70 hover:text-black'
            }`}
          >
            <span>Verified Reviews ({reviews.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto flex-1 p-6 bg-white dark:bg-[#121522]">
          {activeTab === 'details' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Product Image */}
              <div className="relative h-64 sm:h-full bg-[#F3F4F6] dark:bg-[#1A1E30] border-2.5 border-black rounded-2xl flex items-center justify-center p-4 shadow-brutal-sm overflow-hidden">
                <img
                  src={imageSrc}
                  alt={currentProduct.title}
                  className="max-h-64 w-full object-contain"
                />
              </div>

              {/* Product Details & Purchase Form */}
              <div className="space-y-4 flex flex-col justify-between text-xs font-bold text-black dark:text-white">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-black dark:text-white font-mono text-[10px]">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#C4B5FD] dark:bg-[#B026FF] dark:text-white border-2 border-black font-black uppercase tracking-wider">
                      {currentProduct.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('reviews')}
                      className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-[#FEF08A] dark:bg-[#FFE600] text-black border border-black hover:underline cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 text-black fill-current" />
                      <span className="font-black">{currentProduct.rating || 5}</span>
                      <span className="opacity-70">({reviews.length} reviews)</span>
                    </button>
                  </div>

                  <h2 className="text-lg sm:text-xl font-display font-black text-black dark:text-white leading-snug">
                    {currentProduct.title}
                  </h2>
                  <p className="text-black/70 dark:text-slate-300 font-semibold leading-relaxed text-xs">
                    {currentProduct.description}
                  </p>

                  {/* Vendor Attribution */}
                  <div className="p-3 rounded-xl bg-[#EBF3FE] dark:bg-[#1A1E30] border-2 border-black flex items-center justify-between text-xs shadow-brutal-sm">
                    <div className="flex items-center space-x-2">
                      <Store className="w-4 h-4 text-black dark:text-[#FFE600]" />
                      <span>
                        Sold by{' '}
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenStore && currentProduct.store?.slug) {
                              onOpenStore(currentProduct.store.slug);
                              onClose();
                            }
                          }}
                          className="font-black text-black dark:text-white underline cursor-pointer hover:text-[#5B85FA]"
                        >
                          {currentProduct.store?.name || 'Verified Store'}
                        </button>
                      </span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded bg-[#6EE7B7] dark:bg-[#00FF87] text-black border border-black text-[9px] font-black uppercase">
                      Direct
                    </span>
                  </div>

                  {/* Guarantees */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-[#6EE7B7] dark:bg-[#00FF87] text-black border-2 border-black font-black">
                      <Truck className="w-3.5 h-3.5 text-black flex-shrink-0" />
                      <span>Free Express</span>
                    </div>
                    <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-[#FEF08A] dark:bg-[#FFE600] text-black border-2 border-black font-black">
                      <RotateCcw className="w-3.5 h-3.5 text-black flex-shrink-0" />
                      <span>Easy Cancel</span>
                    </div>
                  </div>
                </div>

                {/* Price, Stock & Dynamic Add/Quantity Stepper */}
                <div className="pt-3 border-t-2 border-black space-y-3">
                  <div className="flex items-baseline justify-between font-mono">
                    <div>
                      <span className="text-2xl font-black text-black dark:text-[#FFE600] font-mono">
                        ${price.toFixed(2)}
                      </span>
                      {compareAtPrice && (
                        <span className="text-xs text-black/50 dark:text-slate-400 line-through ml-2">
                          ${compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono font-black">
                      Stock:{' '}
                      <span className={currentStock > 0 ? 'text-black dark:text-[#00FF87]' : 'text-rose-600'}>
                        {currentStock > 0 ? `${currentStock} units` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  {/* Unified Dynamic Button / Quantity Stepper */}
                  {(() => {
                    if (currentStock === 0) {
                      return (
                        <button
                          type="button"
                          disabled
                          className="w-full py-3.5 px-4 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border-2.5 border-slate-400 font-display font-black text-xs"
                        >
                          Out of Stock
                        </button>
                      );
                    }

                    if (cartQty > 0) {
                      return (
                        <div className="flex items-center justify-between bg-[#FEF08A] dark:bg-[#FFE600] border-2.5 border-black rounded-2xl shadow-brutal p-1.5 text-black font-black animate-pop-in">
                          <button
                            type="button"
                            onClick={() => updateQuantity(currentProduct._id, cartQty - 1)}
                            className="p-2.5 hover:bg-[#FDE047] dark:hover:bg-[#FFF500] active:scale-95 transition rounded-xl cursor-pointer flex items-center justify-center bg-white border-2 border-black shadow-brutal-sm"
                            title="Decrease quantity (-1)"
                          >
                            <Minus className="w-4 h-4 text-black stroke-[3]" />
                          </button>

                          <div className="flex flex-col items-center px-4 select-none">
                            <span className="font-mono text-sm font-black text-black">
                              {cartQty} in Cart
                            </span>
                            <span className="text-[10px] font-mono text-black/70 font-bold">
                              Subtotal: ${(price * cartQty).toFixed(2)}
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={cartQty >= currentStock}
                            onClick={() => {
                              if (cartQty < currentStock) {
                                addToCart(currentProduct, 1);
                              }
                            }}
                            className="p-2.5 hover:bg-[#FDE047] dark:hover:bg-[#FFF500] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition rounded-xl cursor-pointer flex items-center justify-center bg-white border-2 border-black shadow-brutal-sm"
                            title={cartQty >= currentStock ? 'Max stock reached' : 'Add more (+1)'}
                          >
                            <Plus className="w-4 h-4 text-black stroke-[3]" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <button
                        type="button"
                        onClick={() => addToCart(currentProduct, 1)}
                        className="w-full py-3.5 px-4 rounded-2xl bg-[#FEF08A] dark:bg-[#FFE600] hover:bg-[#FDE047] dark:hover:bg-[#FFF500] text-black font-display font-black text-xs border-2.5 border-black shadow-brutal hover:translate-x-[-1px] hover:translate-y-[-1px] flex items-center justify-center space-x-2 transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-black stroke-[3]" />
                        <span>Add to Cart</span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            /* --- REVIEWS TAB --- */
            <div className="space-y-6 text-xs font-bold text-black dark:text-white animate-pop-in">
              {/* Rating Summary */}
              <div className="bg-[#FEF08A] dark:bg-[#FFE600] border-2.5 border-black rounded-2xl p-5 shadow-brutal flex items-center justify-between text-black">
                <div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-black font-mono text-black">
                      {currentProduct.rating || 5}
                    </span>
                    <span className="text-xs text-black/70 font-mono">/ 5.0</span>
                  </div>
                  <div className="flex items-center space-x-1 text-black my-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= Math.round(currentProduct.rating || 5)
                            ? 'fill-current text-black'
                            : 'text-black/30'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[11px] font-mono text-black/70">
                    Based on {reviews.length} customer ratings
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 rounded-xl bg-white border-2 border-black text-xs font-black shadow-brutal-sm text-black">
                    ★ 100% Verified
                  </span>
                </div>
              </div>

              {/* Add Review Form */}
              {user ? (
                <form
                  onSubmit={handleSubmitReview}
                  className="bg-white dark:bg-[#1A1E30] border-2.5 border-black rounded-2xl p-5 shadow-brutal space-y-3.5"
                >
                  <div className="flex items-center justify-between border-b-2 border-black pb-2">
                    <h3 className="font-display font-black text-black dark:text-white flex items-center space-x-1.5">
                      <MessageSquare className="w-4 h-4 text-black dark:text-white" />
                      <span>Write a Customer Review</span>
                    </h3>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="p-0.5 text-black dark:text-white hover:scale-125 transition cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= newRating
                                ? 'fill-current text-[#FFE600] dark:text-[#FFE600]'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {reviewSuccess && (
                    <div className="p-3 rounded-xl bg-[#6EE7B7] dark:bg-[#00FF87] border-2 border-black text-black text-xs font-bold flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-black" />
                      <span>Your review has been published!</span>
                    </div>
                  )}

                  {reviewError && (
                    <div className="p-3 rounded-xl bg-[#FF6B97]/20 border-2 border-black text-black dark:text-white text-xs font-bold flex items-center space-x-1.5">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                      <span>{reviewError}</span>
                    </div>
                  )}

                  <textarea
                    rows={2}
                    required
                    placeholder="Share your experience regarding build quality, packaging, and delivery..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#121522] border-2 border-black text-black dark:text-white text-xs shadow-brutal-sm focus:bg-[#FEFCE8] dark:focus:bg-[#252A42] focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-2.5 rounded-xl bg-[#6EE7B7] dark:bg-[#00FF87] hover:bg-[#34D399] text-black font-display font-black text-xs border-2 border-black shadow-brutal flex items-center space-x-1.5 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingReview ? 'Submitting...' : 'Post Review'}</span>
                  </button>
                </form>
              ) : null}

              {/* Reviews List */}
              <div className="space-y-3">
                <h3 className="font-display font-black text-black dark:text-white text-xs uppercase tracking-wider">
                  Customer Feedback
                </h3>
                {reviews.length === 0 ? (
                  <p className="text-black/60 dark:text-slate-400 text-xs py-4 text-center">
                    Be the first customer to review this item!
                  </p>
                ) : (
                  reviews.map((rev, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-[#F9FAFB] dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-xl bg-[#FEF08A] dark:bg-[#FFE600] border-2 border-black flex items-center justify-center text-black font-black text-xs shadow-xs">
                            {rev.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-display font-black text-black dark:text-white text-xs">
                              {rev.name}
                            </div>
                            <div className="text-[10px] text-black/60 dark:text-slate-400 font-mono">
                              {rev.createdAt
                                ? new Date(rev.createdAt).toLocaleDateString()
                                : 'Verified Buyer'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-0.5 text-black">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating
                                  ? 'fill-current text-[#FFE600]'
                                  : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-black dark:text-slate-200 font-semibold leading-relaxed text-xs">
                        {rev.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
