import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  X,
  Star,
  MapPin,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  User,
  GraduationCap,
  Calendar,
  Sparkles,
  Package,
} from 'lucide-react';

export const ProductDetailModal = ({ product: initialProduct, onClose, onReservationSuccess }) => {
  const { user } = useAuth();
  const [product, setProduct] = useState(initialProduct);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'reviews'

  // Reserve form state
  const [isReserving, setIsReserving] = useState(false);
  const [reserveNotes, setReserveNotes] = useState('');
  const [reserveQuantity, setReserveQuantity] = useState(1);
  const [reserveLoading, setReserveLoading] = useState(false);
  const [reserveSuccess, setReserveSuccess] = useState(false);
  const [reserveError, setReserveError] = useState(null);

  // Review Form State
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (!initialProduct) {
      setProduct(null);
      return;
    }

    setProduct(initialProduct);
    setActiveTab('details');
    setIsReserving(false);
    setReserveNotes('');
    setReserveQuantity(1);
    setReserveSuccess(false);
    setReserveError(null);
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
          console.error('Failed to fetch detailed listing:', err);
        });
    }

    return () => {
      isSubscribed = false;
    };
  }, [initialProduct]);

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

  if (!initialProduct) return null;

  const currentProduct = product || initialProduct;
  if (!currentProduct) return null;

  const reviews = currentProduct.reviews || [];
  const price = typeof currentProduct.price === 'number' ? currentProduct.price : 0;
  const compareAtPrice = typeof currentProduct.compareAtPrice === 'number' ? currentProduct.compareAtPrice : null;
  const availableStock =
    currentProduct.quantity !== undefined
      ? currentProduct.quantity
      : currentProduct.stock !== undefined
      ? currentProduct.stock
      : 1;
  const isAvailable = currentProduct.status === 'AVAILABLE' && availableStock > 0;

  const imageSrc =
    currentProduct.images && currentProduct.images.length > 0
      ? currentProduct.images[0]
      : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';

  const seller = currentProduct.seller;
  const currentUserId = (user?._id || user?.id || '').toString();
  const sellerId = (
    seller?._id ||
    seller?.id ||
    (typeof seller === 'string' ? seller : '')
  ).toString();
  const isOwnListing = Boolean(currentUserId && sellerId && currentUserId === sellerId);

  const handleConfirmReservation = async (e) => {
    e.preventDefault();
    setReserveLoading(true);
    setReserveError(null);

    const qtyToReserve = Math.min(availableStock, Math.max(1, parseInt(reserveQuantity, 10) || 1));

    try {
      const res = await api.reserveItem(
        currentProduct._id,
        currentProduct.pickupLocation || 'Campus Hostel Gate',
        reserveNotes,
        qtyToReserve
      );

      if (res.success) {
        setReserveSuccess(true);
        const remainingStock = Math.max(0, availableStock - qtyToReserve);
        setProduct((prev) => ({
          ...prev,
          status: remainingStock === 0 ? 'RESERVED' : 'AVAILABLE',
          quantity: remainingStock,
          stock: remainingStock,
        }));
        setIsReserving(false);
        if (onReservationSuccess) onReservationSuccess(res.order || res.reservation);
      } else {
        setReserveError(
          res.message || 'Item is no longer available or has already been reserved by another student.'
        );
      }
    } catch (err) {
      setReserveError(err.message || 'Error reserving item');
    } finally {
      setReserveLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingReview(true);
    setReviewError(null);
    try {
      const res = await api.createProductReview(currentProduct._id, {
        rating: newRating,
        comment: newComment.trim(),
      });

      if (res.success) {
        setReviewSuccess(true);
        setNewComment('');
        const updated = await api.getProductById(currentProduct._id);
        if (updated?.success) setProduct(updated.product);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-pop-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-[#121522] border-3 border-black rounded-3xl shadow-brutal-xl overflow-hidden max-h-[92vh] flex flex-col z-10 text-black dark:text-white">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b-3 border-black bg-white dark:bg-[#121522] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-[#FEF08A] dark:bg-[#FFE600] text-black border-2 border-black text-xs font-mono font-black">
              {currentProduct.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-[#1A1E30] text-black dark:text-white border-2 border-black text-xs font-mono font-black">
              Condition: {currentProduct.condition || 'Good'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm hover:bg-[#FF6B97] hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Reservation Success Banner */}
          {reserveSuccess && (
            <div className="p-4 rounded-2xl bg-[#6EE7B7] text-black border-2.5 border-black font-bold text-xs shadow-brutal flex items-center space-x-2.5 animate-pop-in">
              <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
              <div>
                <div className="font-display font-black text-sm">Item Successfully Reserved!</div>
                <div>Request sent to seller. Check "My Purchases" to coordinate campus meetup.</div>
              </div>
            </div>
          )}

          {/* Reservation Conflict / Error Banner */}
          {reserveError && (
            <div className="p-4 rounded-2xl bg-[#FF6B97] text-white border-2.5 border-black font-bold text-xs shadow-brutal flex items-center space-x-2.5 animate-pop-in">
              <AlertCircle className="w-5 h-5 text-white shrink-0" />
              <div>
                <div className="font-display font-black text-sm">Reservation Conflict</div>
                <div>{reserveError}</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Image Box */}
            <div className="relative h-60 sm:h-72 rounded-2xl overflow-hidden border-2.5 border-black bg-gray-100 shadow-brutal-sm">
              <img src={imageSrc} alt={currentProduct.title} className="w-full h-full object-cover" />

              {/* Status Overlay */}
              <div className="absolute top-3 left-3">
                <span
                  className={`px-3 py-1 rounded-xl border-2 border-black text-xs font-mono font-black shadow-sm ${
                    currentProduct.status === 'AVAILABLE'
                      ? 'bg-[#6EE7B7] text-black'
                      : currentProduct.status === 'RESERVED'
                      ? 'bg-[#FEF08A] text-black'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {currentProduct.status}
                </span>
              </div>
            </div>

            {/* Info Column */}
            <div className="space-y-3.5 flex flex-col justify-between">
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-display font-black text-black dark:text-white leading-tight">
                  {currentProduct.title}
                </h1>

                <div className="flex items-baseline space-x-2 font-mono">
                  <span className="text-2xl font-black text-black dark:text-[#FFE600]">
                    ₹{price.toLocaleString()}
                  </span>
                  {compareAtPrice && (
                    <span className="text-xs text-black/50 dark:text-slate-400 line-through">
                      MRP ₹{compareAtPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-black/80 dark:text-slate-300 leading-relaxed">
                  {currentProduct.description}
                </p>
              </div>

              {/* Attributes / Details */}
              <div className="space-y-2 pt-2 border-t-2 border-black text-xs font-mono">
                {/* Available Stock Badge */}
                <div className="flex items-center space-x-2 p-2 rounded-xl bg-[#6EE7B7]/25 dark:bg-[#00FF87]/15 border border-black">
                  <Package className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold">Inventory: </span>
                    <span className="font-black text-emerald-800 dark:text-emerald-300">
                      {isAvailable
                        ? `${availableStock} ${availableStock === 1 ? 'unit' : 'units'} available`
                        : currentProduct.status === 'RESERVED'
                        ? 'Reserved by campus buyer'
                        : 'Sold out'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-2 rounded-xl bg-[#FEF08A]/40 dark:bg-[#2A2710] border border-black">
                  <MapPin className="w-4 h-4 text-black dark:text-[#FFE600] shrink-0" />
                  <div>
                    <span className="font-bold">Pickup: </span>
                    <span className="font-black">{currentProduct.pickupLocation || 'Campus Hostel Gate'}</span>
                  </div>
                </div>

                {currentProduct.reasonForSelling && (
                  <div className="flex items-center space-x-2 p-2 rounded-xl bg-[#FF6B97]/20 border border-black">
                    <span className="font-bold">Reason for Selling: </span>
                    <span className="font-black text-rose-600 dark:text-rose-400">
                      {currentProduct.reasonForSelling}
                    </span>
                  </div>
                )}

                {/* Seller Attribution */}
                <div className="p-3 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1E30] border border-black space-y-1">
                  <div className="text-[10px] uppercase font-black text-black/60 dark:text-slate-400">
                    Seller Profile
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-display font-black text-xs flex items-center gap-1.5">
                      <span>Seller: {seller?.name || 'Verified Student'}</span>
                      <span className="px-1.5 py-0.2 rounded bg-[#6EE7B7] text-black border border-black text-[9px] font-mono font-black uppercase">
                        ✓ Verified Student
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-black/70 dark:text-slate-300">
                    {currentProduct.college || seller?.college || 'MNIT Jaipur'} • {seller?.branch || currentProduct.branch || 'Engineering'} ({seller?.year || currentProduct.year || 'Student'})
                  </div>
                  {seller?.hostel && (
                    <div className="text-[10px] text-black/60 dark:text-slate-400">
                      Residence: {seller.hostel}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Inline Reservation Form */}
          {isReserving && isAvailable && (
            <form
              onSubmit={handleConfirmReservation}
              className="p-4 rounded-2xl bg-[#FEF08A] dark:bg-[#2A2710] border-2.5 border-black shadow-brutal space-y-3 text-black dark:text-white animate-pop-in"
            >
              <div className="font-display font-black text-sm">Confirm Campus Reservation</div>
              <p className="text-xs font-bold text-black/80 dark:text-slate-300">
                Payment is settled directly between the buyer and seller during the physical campus hand-off.
              </p>

              {/* Quantity Selector */}
              {availableStock > 1 ? (
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#121522] border-2 border-black space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase font-black text-black dark:text-white">
                      Quantity to Reserve (Max: {availableStock})
                    </label>
                    <span className="text-xs font-mono font-black text-black dark:text-[#FFE600]">
                      Total: ₹{(price * reserveQuantity).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="number"
                      min="1"
                      max={availableStock}
                      value={reserveQuantity}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(availableStock, parseInt(e.target.value, 10) || 1));
                        setReserveQuantity(val);
                      }}
                      className="w-24 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#1A1E30] border-2 border-black text-xs font-mono font-black shadow-xs"
                    />
                    <span className="text-xs font-mono font-bold text-black/70 dark:text-slate-300">
                      units @ ₹{price.toLocaleString()} each
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#121522] border-2 border-black flex items-center justify-between text-xs font-mono font-bold">
                  <span>Reserving: 1 Unit</span>
                  <span className="font-black text-black dark:text-[#FFE600]">Total: ₹{price.toLocaleString()}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-mono uppercase font-black text-black dark:text-white">
                  Optional Note for Seller (e.g. preferred pickup time)
                </label>
                <input
                  type="text"
                  value={reserveNotes}
                  onChange={(e) => setReserveNotes(e.target.value)}
                  placeholder="e.g. Free to meet today after 5 PM near Hostel 5"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white dark:bg-[#121522] border-2 border-black text-xs font-bold shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsReserving(false)}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black text-xs font-display font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reserveLoading}
                  className="px-5 py-2 rounded-xl bg-[#6EE7B7] text-black border-2 border-black font-display font-black text-xs shadow-brutal hover:bg-[#34D399] transition cursor-pointer flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{reserveLoading ? 'Reserving...' : `Confirm & Request (${reserveQuantity} ${reserveQuantity === 1 ? 'unit' : 'units'})`}</span>
                </button>
              </div>
            </form>
          )}

          {/* Reviews Section */}
          <div className="pt-4 border-t-2 border-black space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-display font-black flex items-center gap-1.5">
                <span>Reviews & Feedback</span>
                <span className="text-xs font-mono font-bold text-black/60 dark:text-slate-400">
                  ({reviews.length})
                </span>
              </h3>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-black/60 dark:text-slate-400 italic">
                No reviews yet for this listing.
              </p>
            ) : (
              <div className="space-y-2.5">
                {reviews.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1E30] border border-black space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold">{r.name}</span>
                      <div className="flex text-[#FFE600]">
                        {'★'.repeat(r.rating)}
                        {'☆'.repeat(5 - r.rating)}
                      </div>
                    </div>
                    <p className="text-black/80 dark:text-slate-300 font-semibold">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 sm:p-5 border-t-3 border-black bg-white dark:bg-[#121522] flex items-center justify-between shrink-0 gap-3">
          <div className="font-mono">
            <div className="text-[10px] text-black/60 dark:text-slate-400 uppercase font-black">Listing Status</div>
            <div className="text-xs font-black">
              {isAvailable ? (
                <span className="text-emerald-600 font-black">
                  AVAILABLE ({availableStock} {availableStock === 1 ? 'Unit' : 'Units'})
                </span>
              ) : currentProduct.status === 'RESERVED' ? (
                <span className="text-amber-500 font-black">RESERVED</span>
              ) : (
                <span className="text-rose-600 font-black">SOLD</span>
              )}
            </div>
          </div>

          <div>
            {isAvailable ? (
              isOwnListing ? (
                <button
                  disabled
                  className="px-6 py-3 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-500 border-2 border-black font-display font-black text-xs cursor-not-allowed"
                >
                  Your Own Listing
                </button>
              ) : !isReserving ? (
                <button
                  onClick={() => setIsReserving(true)}
                  className="px-6 py-3 rounded-2xl bg-[#6EE7B7] hover:bg-[#34D399] text-black border-2.5 border-black shadow-brutal font-display font-black text-xs hover:translate-x-[-1px] hover:translate-y-[-1px] transition cursor-pointer flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Reserve Item</span>
                </button>
              ) : null
            ) : currentProduct.status === 'RESERVED' ? (
              <button
                disabled
                className="px-6 py-3 rounded-2xl bg-[#FEF08A] text-black border-2.5 border-black font-display font-black text-xs cursor-not-allowed"
              >
                Reserved
              </button>
            ) : (
              <button
                disabled
                className="px-6 py-3 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-500 border-2.5 border-black font-display font-black text-xs cursor-not-allowed"
              >
                SOLD
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
