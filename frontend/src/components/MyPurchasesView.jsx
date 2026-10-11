import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RejectCancelModal } from './RejectCancelModal';
import {
  Package,
  MapPin,
  RefreshCw,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Send,
  User,
  GraduationCap,
  Layers,
  Inbox,
  Lock,
  Phone,
  AlertCircle,
} from 'lucide-react';

export const MyPurchasesView = ({ onGoToMarketplace, initialTab = 'purchases' }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab); // 'purchases' | 'incoming'
  const [purchases, setPurchases] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Sync activeTab when initialTab changes
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Reject / Cancel Dialog State
  const [rejectModalState, setRejectModalState] = useState({
    isOpen: false,
    requestId: null,
    actionType: 'reject', // 'reject' | 'cancel'
    title: 'Reject/Cancel Reservation',
  });
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Review modal state
  const [reviewModalOrder, setReviewModalOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [purchasesRes, incomingRes] = await Promise.all([
        api.getMyPurchases(),
        api.getSellerRequests(),
      ]);

      if (purchasesRes?.success) {
        setPurchases(purchasesRes.requests || purchasesRes.orders || []);
      }
      if (incomingRes?.success) {
        setIncomingRequests(incomingRes.requests || incomingRes.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch reservations data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Buyer cancels reservation
  const handleBuyerCancel = (requestId) => {
    setRejectModalState({
      isOpen: true,
      requestId,
      actionType: 'cancel',
      title: 'Cancel Campus Reservation',
    });
  };

  // Seller rejects incoming request
  const handleSellerReject = (requestId) => {
    setRejectModalState({
      isOpen: true,
      requestId,
      actionType: 'reject',
      title: 'Reject/Cancel Reservation',
    });
  };

  // Seller cancels accepted reservation
  const handleSellerCancel = (requestId) => {
    setRejectModalState({
      isOpen: true,
      requestId,
      actionType: 'cancel',
      title: 'Reject/Cancel Reservation',
    });
  };

  // Confirm Reject / Cancel with Reason
  const handleConfirmRejectCancel = async (reason) => {
    const { requestId, actionType } = rejectModalState;
    if (!requestId) return;

    setRejectSubmitting(true);
    try {
      let res;
      if (actionType === 'reject') {
        res = await api.rejectReservation(requestId, reason);
      } else {
        res = await api.cancelReservation(requestId, reason);
      }

      if (res?.success) {
        setMessage(
          actionType === 'reject'
            ? 'Reservation request declined. Listing restored to Available.'
            : 'Reservation cancelled. Listing restored to Available.'
        );
        setRejectModalState({ isOpen: false, requestId: null, actionType: 'reject', title: '' });
        fetchData();
        setTimeout(() => setMessage(null), 5000);
      } else {
        alert(res?.message || 'Failed to update reservation');
      }
    } catch (err) {
      alert(err.message || 'Error processing request');
    } finally {
      setRejectSubmitting(false);
    }
  };

  // Seller accepts incoming request
  const handleAcceptRequest = async (requestId) => {
    setActionLoadingId(requestId);
    try {
      const res = await api.acceptReservation(requestId);
      if (res?.success) {
        setMessage('Reservation accepted! Meet buyer on campus for physical hand-off.');
        fetchData();
        setTimeout(() => setMessage(null), 5000);
      } else {
        alert(res?.message || 'Failed to accept reservation');
      }
    } catch (err) {
      alert(err.message || 'Error accepting reservation');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Seller marks completed
  const handleCompleteHandOff = async (requestId) => {
    if (!window.confirm('Confirm that the in-person campus hand-off is finished? This will mark the listing as SOLD.')) {
      return;
    }
    setActionLoadingId(requestId);
    try {
      const res = await api.completeReservation(requestId);
      if (res?.success) {
        setMessage('Exchange completed! Listing is now marked as SOLD.');
        fetchData();
        setTimeout(() => setMessage(null), 5000);
      } else {
        alert(res?.message || 'Failed to complete exchange');
      }
    } catch (err) {
      alert(err.message || 'Error completing exchange');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModalOrder || !reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const targetListingId =
        reviewModalOrder.listing?._id ||
        reviewModalOrder.listing ||
        reviewModalOrder.product?._id ||
        reviewModalOrder.product;

      const res = await api.createProductReview(targetListingId, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      if (res?.success) {
        setMessage('Review submitted successfully! Thank you for supporting peer trust on campus.');
        setReviewModalOrder(null);
        setReviewComment('');
        setTimeout(() => setMessage(null), 5000);
      } else {
        alert(res?.message || 'Failed to record review');
      }
    } catch (err) {
      alert(err.message || 'Error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const pendingIncomingCount = incomingRequests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pop-in">
      {/* Header Banner */}
      <div className="bg-[#FEF08A] dark:bg-[#FFE600] border-3 border-black rounded-3xl p-6 sm:p-8 shadow-brutal-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-black">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-black text-white text-xs font-mono font-black">
              CAMPUS RESERVATIONS
            </span>
            <span className="text-xs font-mono font-bold text-black bg-white px-2 py-0.5 rounded border border-black">
              In-Person Hand-Off
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-black mt-2">
            Reservations & Campus Pickups
          </h1>
          <p className="text-xs font-mono font-bold text-black/80 mt-1">
            Payment is settled directly between the buyer and seller during physical campus hand-off.
          </p>
          <p className="text-xs sm:text-sm font-bold text-black/80 mt-1">
            Manage both your purchased reservations and incoming buyer requests in one place.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          {onGoToMarketplace && (
            <button
              onClick={onGoToMarketplace}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-black font-display font-black text-xs border-2 border-black shadow-brutal flex items-center space-x-1.5 transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Marketplace</span>
            </button>
          )}

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border-2.5 border-black shadow-brutal hover:bg-slate-100 transition text-black cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-[#6EE7B7] text-black border-2.5 border-black font-bold text-xs shadow-brutal flex items-center space-x-2 animate-pop-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Two Clearly Labelled Sections / Tabs (Requirement 5) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-3 border-black pb-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-2.5 rounded-xl text-xs font-display font-black border-2 border-black transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'purchases'
                ? 'bg-[#C4B5FD] text-black shadow-brutal'
                : 'bg-white dark:bg-[#1A1E30] text-black dark:text-white shadow-brutal-sm'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>My Purchases ({purchases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('incoming')}
            className={`px-4 py-2.5 rounded-xl text-xs font-display font-black border-2 border-black transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'incoming'
                ? 'bg-[#6EE7B7] dark:bg-[#00FF87] text-black shadow-brutal'
                : 'bg-white dark:bg-[#1A1E30] text-black dark:text-white shadow-brutal-sm'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Incoming Requests ({incomingRequests.length})</span>
            {pendingIncomingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#FF6B97] text-white text-[10px] font-mono font-black animate-pulse">
                {pendingIncomingCount} pending
              </span>
            )}
          </button>
        </div>

        <div className="text-[11px] font-mono font-bold text-black/70 dark:text-slate-400">
          {activeTab === 'purchases'
            ? '🛍️ Items you requested to buy from other students'
            : '📬 Requests submitted by other students to buy your listings'}
        </div>
      </div>

      {/* TAB 1: My Purchases (Reservations made by logged-in student) */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 bg-white dark:bg-[#121522] border-3 border-black rounded-3xl animate-pulse shadow-brutal" />
              ))}
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#121522] border-3 border-black rounded-3xl p-8 shadow-brutal space-y-3 text-black dark:text-white">
              <Package className="w-12 h-12 mx-auto opacity-40 text-black dark:text-white" />
              <h3 className="font-display font-black text-base">No Items Reserved Yet</h3>
              <p className="text-xs font-bold text-black/70 dark:text-slate-300 max-w-sm mx-auto">
                You haven't requested any items yet. Browse listings from fellow students on the campus marketplace!
              </p>
              {onGoToMarketplace && (
                <button
                  onClick={onGoToMarketplace}
                  className="mt-2 px-4 py-2.5 rounded-xl bg-[#FEF08A] text-black font-display font-black text-xs border-2 border-black shadow-brutal inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Browse Campus Marketplace</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => {
                const listing = purchase.product || purchase.listing;
                const seller = purchase.seller;
                const isAccepted = purchase.status === 'ACCEPTED' || purchase.status === 'COMPLETED';
                const isCancelledOrRejected = purchase.status === 'CANCELLED' || purchase.status === 'REJECTED';

                return (
                  <div
                    key={purchase._id}
                    className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#161A2B] border-3 border-black shadow-brutal-lg space-y-4 text-black dark:text-white"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#C4B5FD] border-2 border-black shadow-brutal-sm flex items-center justify-center text-xl shrink-0">
                          🔖
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-black text-white text-[10px] font-mono font-black uppercase">
                              OUTGOING PURCHASE
                            </span>
                            <span className="text-sm font-mono font-black">
                              Reservation #{purchase._id.slice(-6).toUpperCase()}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-lg border-2 border-black text-xs font-mono font-black ${
                                purchase.status === 'ACCEPTED'
                                  ? 'bg-[#6EE7B7] text-black'
                                  : purchase.status === 'COMPLETED'
                                  ? 'bg-[#C4B5FD] text-black'
                                  : isCancelledOrRejected
                                  ? 'bg-[#FF6B97] text-white'
                                  : 'bg-[#FEF08A] text-black'
                              }`}
                            >
                              {purchase.status === 'PENDING' ? '⏳ WAITING FOR SELLER APPROVAL' : purchase.status}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-black/70 dark:text-slate-300 mt-1">
                            Requested on {new Date(purchase.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-black font-mono text-black dark:text-[#FFE600]">
                          ₹{(purchase.totalAmount || ((listing?.price || 0) * (purchase.quantity || 1))).toLocaleString()}
                        </div>
                        <div className="text-[10px] font-mono font-bold text-black/60 dark:text-slate-400">
                          {purchase.quantity && purchase.quantity > 1 ? `${purchase.quantity} units @ ₹${listing?.price?.toLocaleString() || 0} • ` : '1 unit • '}Pay directly during campus hand-off
                        </div>
                      </div>
                    </div>

                    {/* Listing & Seller Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Listing Card */}
                      <div className="p-3.5 rounded-2xl bg-[#F9FAFB] dark:bg-[#1F2438] border-2 border-black flex items-center space-x-3">
                        {listing?.images?.[0] || listing?.image ? (
                          <img
                            src={listing?.images?.[0] || listing?.image}
                            alt={listing?.title}
                            className="w-14 h-14 rounded-xl object-cover border-2 border-black shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-slate-200 border-2 border-black shrink-0 flex items-center justify-center font-black">
                            📦
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-display font-black truncate">{listing?.title || 'Campus Item'}</div>
                          <div className="text-[11px] font-mono text-black/70 dark:text-slate-300">
                            Category: {listing?.category || 'Student Item'} • Condition: {listing?.condition || 'Good'}
                          </div>
                          <div className="text-[11px] font-mono font-bold text-black dark:text-[#FFE600]">
                            ₹{listing?.price?.toLocaleString() || '0'} {purchase.quantity && purchase.quantity > 1 ? `(Qty: ${purchase.quantity})` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Seller Profile with Privacy Enforcement (Section 8) */}
                      <div className="p-3.5 rounded-2xl bg-[#F9FAFB] dark:bg-[#1F2438] border-2 border-black space-y-1.5">
                        <div className="text-[10px] font-mono uppercase font-black text-black/60 dark:text-slate-400">
                          Seller Profile
                        </div>
                        <div className="text-xs font-display font-black flex items-center gap-1.5">
                          <span>Seller: {seller?.name || 'Fellow Student'}</span>
                          <span className="px-1.5 py-0.2 rounded bg-[#6EE7B7] text-black border border-black text-[9px] font-mono font-black uppercase">
                            ✓ Verified Student
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-black/70 dark:text-slate-300 truncate">
                          {seller?.college || 'MNIT Jaipur'} • {seller?.year || 'Student'} ({seller?.branch || 'Engineering'})
                        </div>
                        {seller?.hostel && (
                          <div className="text-[10px] font-mono text-black/60 dark:text-slate-400">
                            Residence: {seller.hostel}
                          </div>
                        )}

                        {/* Privacy Rule: Phone hidden until accepted */}
                        {isAccepted && seller?.phone ? (
                          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500 text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                              <Phone className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                              <span>Contact for Hand-off: {seller.phone}</span>
                            </div>
                            <a
                              href={`tel:${seller.phone}`}
                              className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition"
                            >
                              Call Seller
                            </a>
                          </div>
                        ) : !isCancelledOrRejected ? (
                          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-400 text-[10px] font-mono font-bold text-amber-800 dark:text-amber-200 flex items-center space-x-1.5">
                            <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                            <span>Seller contact details will be available after your reservation is accepted.</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Coordination: Campus Pickup Spot & Buyer Note */}
                    <div className="p-3 rounded-2xl bg-[#FEF08A]/30 dark:bg-[#2A2710] border-2 border-black space-y-1.5 text-xs">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 shrink-0 text-black dark:text-[#FFE600]" />
                        <span className="font-bold">Campus Pickup Spot: </span>
                        <span className="font-mono font-black">{purchase.pickupLocation || 'Campus Hostel Gate'}</span>
                      </div>
                      {purchase.notes && (
                        <div className="text-black/80 dark:text-slate-300 italic font-mono text-[11px] pl-6">
                          <span className="font-bold not-italic">Your Note: </span>"{purchase.notes}"
                        </div>
                      )}
                    </div>

                    {/* Rejection / Cancellation Reason (Section 9) */}
                    {isCancelledOrRejected && (purchase.cancellationReason || purchase.notes) && (
                      <div className="p-3.5 rounded-2xl bg-[#FF6B97]/20 border-2 border-black space-y-1 text-xs">
                        <div className="font-display font-black text-rose-700 dark:text-rose-400 flex items-center space-x-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>Status: {purchase.status}</span>
                        </div>
                        <div className="text-[11px] font-medium text-black dark:text-slate-200">
                          <span className="font-bold">Reason from seller: </span>
                          "{purchase.cancellationReason || purchase.notes}"
                        </div>
                        {purchase.cancelledAt && (
                          <div className="text-[10px] font-mono text-black/60 dark:text-slate-400">
                            Updated on {new Date(purchase.cancelledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2 border-t-2 border-black flex flex-wrap items-center justify-end gap-2.5">
                      {(purchase.status === 'PENDING' || purchase.status === 'ACCEPTED') && (
                        <button
                          onClick={() => handleBuyerCancel(purchase._id)}
                          className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border-2 border-black font-display font-black text-xs shadow-brutal-sm transition cursor-pointer"
                        >
                          Cancel Reservation
                        </button>
                      )}

                      {purchase.status === 'COMPLETED' && (
                        <button
                          onClick={() => setReviewModalOrder(purchase)}
                          className="px-5 py-2 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-black border-2 border-black font-display font-black text-xs shadow-brutal transition cursor-pointer flex items-center space-x-1.5"
                        >
                          <Star className="w-4 h-4 fill-current text-black" />
                          <span>Leave Review for Seller</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Incoming Requests (Requests for student's listings - Requirement 5) */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 bg-white dark:bg-[#121522] border-3 border-black rounded-3xl animate-pulse shadow-brutal" />
              ))}
            </div>
          ) : incomingRequests.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#121522] border-3 border-black rounded-3xl p-8 shadow-brutal space-y-3 text-black dark:text-white">
              <Inbox className="w-12 h-12 mx-auto opacity-40 text-black dark:text-white" />
              <h3 className="font-display font-black text-base">No Incoming Requests Yet</h3>
              <p className="text-xs font-bold text-black/70 dark:text-slate-300 max-w-sm mx-auto">
                When other students request to reserve items from your campus listings, their requests will appear here for you to accept or decline.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomingRequests.map((req) => {
                const listing = req.product || req.listing;
                const buyer = req.buyer;

                return (
                  <div
                    key={req._id}
                    className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#161A2B] border-3 border-black shadow-brutal-lg space-y-4 text-black dark:text-white"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#FEF08A] dark:bg-[#FFE600] border-2 border-black shadow-brutal-sm flex items-center justify-center text-xl shrink-0">
                          📦
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-mono font-black uppercase">
                              INCOMING REQUEST FOR YOUR LISTING
                            </span>
                            <span className="text-sm font-mono font-black">
                              Request #{req._id.slice(-6).toUpperCase()}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-lg border-2 border-black text-xs font-mono font-black ${
                                req.status === 'ACCEPTED'
                                  ? 'bg-[#6EE7B7] text-black'
                                  : req.status === 'COMPLETED'
                                  ? 'bg-[#C4B5FD] text-black'
                                  : req.status === 'REJECTED' || req.status === 'CANCELLED'
                                  ? 'bg-[#FF6B97] text-white'
                                  : 'bg-[#FEF08A] text-black animate-pulse'
                              }`}
                            >
                              {req.status === 'PENDING' ? '⏳ PENDING YOUR APPROVAL' : req.status}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-black/70 dark:text-slate-300 mt-1">
                            Received on {new Date(req.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-black font-mono text-black dark:text-[#FFE600]">
                          ₹{(req.totalAmount || ((listing?.price || 0) * (req.quantity || 1))).toLocaleString()}
                        </div>
                        <div className="text-[10px] font-mono font-bold text-black/60 dark:text-slate-400">
                          {req.quantity && req.quantity > 1 ? `${req.quantity} units requested • ` : '1 unit • '}Direct Student Cash/UPI at Pickup
                        </div>
                      </div>
                    </div>

                    {/* Buyer & Item Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Listing Card */}
                      <div className="p-3.5 rounded-2xl bg-[#F9FAFB] dark:bg-[#1F2438] border-2 border-black flex items-center space-x-3">
                        {listing?.images?.[0] || listing?.image ? (
                          <img
                            src={listing?.images?.[0] || listing?.image}
                            alt={listing?.title}
                            className="w-14 h-14 rounded-xl object-cover border-2 border-black shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-slate-200 border-2 border-black shrink-0 flex items-center justify-center font-black">
                            📦
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-display font-black truncate">{listing?.title || 'Campus Item'}</div>
                          <div className="text-[11px] font-mono text-black/70 dark:text-slate-300">
                            Category: {listing?.category || 'Student Item'} • Condition: {listing?.condition || 'Good'}
                          </div>
                          <div className="text-[11px] font-mono font-bold text-black dark:text-[#FFE600]">
                            ₹{listing?.price?.toLocaleString() || '0'} {req.quantity && req.quantity > 1 ? `(Qty: ${req.quantity})` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Buyer Details */}
                      <div className="p-3.5 rounded-2xl bg-[#F9FAFB] dark:bg-[#1F2438] border-2 border-black space-y-1.5">
                        <div className="text-[10px] font-mono uppercase font-black text-black/60 dark:text-slate-400">
                          Buyer Profile
                        </div>
                        <div className="text-xs font-display font-black flex items-center gap-1.5">
                          <span>Buyer: {buyer?.name || 'Fellow Student'}</span>
                          <span className="px-1.5 py-0.2 rounded bg-[#6EE7B7] text-black border border-black text-[9px] font-mono font-black uppercase">
                            ✓ Verified
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-black/70 dark:text-slate-300 truncate">
                          {buyer?.college || 'MNIT Jaipur'} • {buyer?.branch || 'Engineering'} ({buyer?.year || 'Student'})
                        </div>
                        {buyer?.hostel && (
                          <div className="text-[10px] font-mono text-black/60 dark:text-slate-400">
                            Residence: {buyer.hostel}
                          </div>
                        )}
                        {buyer?.phone && (
                          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500 text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Buyer Phone: {buyer.phone}</span>
                            </div>
                            <a
                              href={`tel:${buyer.phone}`}
                              className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition"
                            >
                              Call Buyer
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pickup location & notes */}
                    <div className="p-3 rounded-2xl bg-[#FEF08A]/30 dark:bg-[#2A2710] border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 shrink-0 text-black dark:text-[#FFE600]" />
                        <span className="font-bold">Proposed Pickup: </span>
                        <span className="font-mono font-black">{req.pickupLocation || 'Campus Hostel Gate'}</span>
                      </div>
                      {req.notes && (
                        <div className="text-black/80 dark:text-slate-300 italic font-mono text-[11px]">
                          <span className="font-bold not-italic">Buyer's Note: </span>"{req.notes}"
                        </div>
                      )}
                    </div>

                    {/* Rejection / Cancellation Reason display if already cancelled/rejected */}
                    {(req.status === 'REJECTED' || req.status === 'CANCELLED') && (req.cancellationReason || req.notes) && (
                      <div className="p-3 rounded-2xl bg-[#FF6B97]/20 border-2 border-black text-xs space-y-1">
                        <div className="font-display font-black text-rose-700 dark:text-rose-400">
                          Reason: "{req.cancellationReason || req.notes}"
                        </div>
                        {req.cancelledAt && (
                          <div className="text-[10px] font-mono text-black/60 dark:text-slate-400">
                            Updated on {new Date(req.cancelledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-2 border-t-2 border-black flex flex-wrap items-center justify-end gap-2.5">
                      {req.status === 'PENDING' && (
                        <>
                          <button
                            disabled={actionLoadingId === req._id}
                            onClick={() => handleSellerReject(req._id)}
                            className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border-2 border-black font-display font-black text-xs shadow-brutal-sm transition cursor-pointer"
                          >
                            Decline Request
                          </button>
                          <button
                            disabled={actionLoadingId === req._id}
                            onClick={() => handleAcceptRequest(req._id)}
                            className="px-5 py-2 rounded-xl bg-[#6EE7B7] hover:bg-[#34D399] text-black border-2 border-black font-display font-black text-xs shadow-brutal transition cursor-pointer flex items-center space-x-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Accept Reservation</span>
                          </button>
                        </>
                      )}

                      {req.status === 'ACCEPTED' && (
                        <>
                          <button
                            disabled={actionLoadingId === req._id}
                            onClick={() => handleSellerCancel(req._id)}
                            className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border-2 border-black font-display font-black text-xs shadow-brutal-sm transition cursor-pointer"
                          >
                            Cancel Reservation
                          </button>
                          <button
                            disabled={actionLoadingId === req._id}
                            onClick={() => handleCompleteHandOff(req._id)}
                            className="px-5 py-2.5 rounded-xl bg-[#6EE7B7] hover:bg-[#34D399] text-black border-2.5 border-black font-display font-black text-xs shadow-brutal transition cursor-pointer flex items-center space-x-2"
                          >
                            <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                            <span>Mark Completed (Hand-off Done)</span>
                          </button>
                        </>
                      )}

                      {req.status === 'COMPLETED' && (
                        <div className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Hand-off Completed (Item SOLD)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog with Reason for Rejection / Cancellation (Section 9) */}
      <RejectCancelModal
        isOpen={rejectModalState.isOpen}
        onClose={() => setRejectModalState({ isOpen: false, requestId: null, actionType: 'reject', title: '' })}
        title={rejectModalState.title}
        actionType={rejectModalState.actionType}
        loading={rejectSubmitting}
        onConfirm={handleConfirmRejectCancel}
      />

      {/* Review Modal */}
      {reviewModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-pop-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setReviewModalOrder(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#121522] border-3 border-black rounded-3xl shadow-brutal-xl p-6 space-y-4 z-10 text-black dark:text-white">
            <h3 className="text-base font-display font-black border-b-2 border-black pb-2">
              Review Exchange: {reviewModalOrder.listing?.title || reviewModalOrder.product?.title || 'Campus Item'}
            </h3>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="text-[10px] font-mono uppercase text-black/70 dark:text-slate-400">Rating (1 to 5 Stars)</label>
                <div className="flex items-center space-x-2 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setReviewRating(s)}
                      className={`p-2 rounded-xl border-2 border-black text-lg transition cursor-pointer ${
                        reviewRating >= s ? 'bg-[#FFE600] text-black shadow-brutal-xs' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="font-mono font-black text-sm ml-2">{reviewRating} / 5</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-black/70 dark:text-slate-400">Comments</label>
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How was the item condition and meetup hand-off with the student?"
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-black border-2 border-black font-display font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-xl bg-[#6EE7B7] text-black border-2 border-black font-display font-black text-xs shadow-brutal cursor-pointer flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingReview ? 'Posting...' : 'Submit Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
