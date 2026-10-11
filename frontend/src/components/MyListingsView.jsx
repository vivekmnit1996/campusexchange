import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CreateProductModal } from './CreateProductModal';
import { RejectCancelModal } from './RejectCancelModal';
import {
  Package,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Eye,
  AlertCircle,
  MapPin,
  User,
  GraduationCap,
  Edit3,
} from 'lucide-react';

export const MyListingsView = ({ onSelectProduct, onOpenCreateListing }) => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('listings'); // 'listings' | 'requests'
  const [requests, setRequests] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Reject / Cancel Dialog State (Section 9)
  const [rejectModalState, setRejectModalState] = useState({
    isOpen: false,
    requestId: null,
    actionType: 'reject',
    title: 'Reject/Cancel Reservation',
  });
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, listRes] = await Promise.all([
        api.getSellerRequests(),
        api.getMyListings(),
      ]);

      if (reqRes?.success) setRequests(reqRes.requests || reqRes.orders || []);
      if (listRes?.success) setMyListings(listRes.products || []);
    } catch (err) {
      console.error('Failed to fetch student listings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAccept = async (orderId) => {
    setActionLoadingId(orderId);
    setActionMessage(null);
    try {
      const res = await api.acceptReservation(orderId);
      if (res.success) {
        setActionMessage('Reservation accepted! Meet the buyer on campus for physical hand-off.');
        fetchData();
        setTimeout(() => setActionMessage(null), 5000);
      } else {
        alert(res.message || 'Failed to accept reservation');
      }
    } catch (err) {
      alert(err.message || 'Error accepting reservation');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineRequest = (orderId) => {
    setRejectModalState({
      isOpen: true,
      requestId: orderId,
      actionType: 'reject',
      title: 'Reject/Cancel Reservation',
    });
  };

  const handleCancelAcceptedReservation = (orderId) => {
    setRejectModalState({
      isOpen: true,
      requestId: orderId,
      actionType: 'cancel',
      title: 'Reject/Cancel Reservation',
    });
  };

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
        setActionMessage(
          actionType === 'reject'
            ? 'Reservation request declined. Listing returned to Available.'
            : 'Reservation cancelled. Listing returned to Available.'
        );
        setRejectModalState({ isOpen: false, requestId: null, actionType: 'reject', title: '' });
        fetchData();
        setTimeout(() => setActionMessage(null), 5000);
      } else {
        alert(res?.message || 'Failed to update reservation');
      }
    } catch (err) {
      alert(err.message || 'Error updating reservation');
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleComplete = async (orderId) => {
    if (!window.confirm('Confirm that the in-person campus hand-off is finished? This will mark the listing as SOLD.')) {
      return;
    }
    setActionLoadingId(orderId);
    setActionMessage(null);
    try {
      const res = await api.completeReservation(orderId);
      if (res.success) {
        setActionMessage('Exchange completed! Listing is now marked as SOLD.');
        fetchData();
        setTimeout(() => setActionMessage(null), 5000);
      } else {
        alert(res.message || 'Failed to complete exchange');
      }
    } catch (err) {
      alert(err.message || 'Error completing exchange');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteListing = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this listing from the campus marketplace?')) {
      return;
    }
    try {
      const res = await api.deleteProduct(productId);
      if (res.success) {
        setActionMessage('Listing deleted successfully.');
        fetchData();
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        alert(res.message || 'Failed to delete listing');
      }
    } catch (err) {
      alert(err.message || 'Error deleting listing');
    }
  };

  const pendingRequestsCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pop-in">
      {/* Top Banner */}
      <div className="bg-[#6EE7B7] dark:bg-[#00FF87] border-3 border-black rounded-3xl p-6 sm:p-8 shadow-brutal-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-black">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-black text-white text-xs font-mono font-black">
              MY CAMPUS LISTINGS
            </span>
            <span className="text-xs font-mono font-bold text-black bg-white px-2 py-0.5 rounded border border-black">
              0% Platform Fee
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-black mt-2">
            My Published Items & Incoming Requests
          </h1>
          <p className="text-xs sm:text-sm font-bold text-black/80 mt-1">
            Manage your listings and coordinate in-person campus hand-offs with peer students.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={() => (onOpenCreateListing ? onOpenCreateListing() : setIsCreateModalOpen(true))}
            className="px-4 py-2.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-black font-display font-black text-xs border-2.5 border-black shadow-brutal flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Sell New Item</span>
          </button>

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

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-[#FEF08A] text-black border-2.5 border-black font-bold text-xs shadow-brutal flex items-center space-x-2 animate-pop-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-3 border-b-3 border-black pb-3">
        <button
          onClick={() => setActiveSubTab('listings')}
          className={`px-4 py-2 rounded-xl text-xs font-display font-black border-2 border-black transition cursor-pointer flex items-center space-x-2 ${
            activeSubTab === 'listings'
              ? 'bg-[#FEF08A] dark:bg-[#FFE600] text-black shadow-brutal'
              : 'bg-white dark:bg-[#1A1E30] text-black dark:text-white shadow-brutal-sm'
          }`}
        >
          <span>My Published Listings</span>
          <span className="px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-mono font-black">
            {myListings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-display font-black border-2 border-black transition cursor-pointer flex items-center space-x-2 ${
            activeSubTab === 'requests'
              ? 'bg-[#FEF08A] dark:bg-[#FFE600] text-black shadow-brutal'
              : 'bg-white dark:bg-[#1A1E30] text-black dark:text-white shadow-brutal-sm'
          }`}
        >
          <span>Incoming Reservation Requests</span>
          {pendingRequestsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#FF6B97] text-white text-[10px] font-mono font-black animate-pulse">
              {pendingRequestsCount} new
            </span>
          )}
        </button>
      </div>

      {/* Sub-Tab 1: My Published Listings */}
      {activeSubTab === 'listings' && (
        <div className="space-y-4">
          {myListings.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#121522] border-3 border-black rounded-3xl p-8 shadow-brutal space-y-3 text-black dark:text-white">
              <Package className="w-12 h-12 mx-auto opacity-40 text-black dark:text-white" />
              <h3 className="font-display font-black text-base">You haven't listed any items yet</h3>
              <p className="text-xs font-bold text-black/70 dark:text-slate-300 max-w-sm mx-auto">
                Sell your pre-loved textbooks, cycles, calculators, or hostel essentials to peer students!
              </p>
              <button
                onClick={() => (onOpenCreateListing ? onOpenCreateListing() : setIsCreateModalOpen(true))}
                className="mt-2 px-4 py-2.5 rounded-xl bg-[#FEF08A] text-black font-display font-black text-xs border-2 border-black shadow-brutal inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Your First Listing</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myListings.map((item) => (
                <div
                  key={item._id}
                  className="bg-white dark:bg-[#161A2B] border-3 border-black rounded-3xl shadow-brutal overflow-hidden flex flex-col justify-between text-black dark:text-white"
                >
                  <div className="relative h-44 bg-[#F3F4F6] dark:bg-[#20253B] border-b-3 border-black overflow-hidden">
                    <img
                      src={item.images?.[0] || item.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg border border-black text-[10px] font-mono font-black shadow-xs ${
                          item.status === 'AVAILABLE'
                            ? 'bg-[#6EE7B7] text-black'
                            : item.status === 'RESERVED'
                            ? 'bg-[#FEF08A] text-black'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono truncate max-w-[85%]">
                      📍 {item.pickupLocation}
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-mono uppercase font-black text-black/60 dark:text-slate-400">
                        {item.category} • {item.condition}
                      </div>
                      <h3 className="text-sm font-display font-black line-clamp-1 mt-0.5">{item.title}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-base font-black font-mono text-black dark:text-[#FFE600]">
                          ₹{item.price?.toLocaleString()}
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1A1E30] border border-black text-[10px] font-mono font-bold">
                          Stock: {item.quantity !== undefined ? item.quantity : (item.stock ?? 1)}
                        </span>
                      </div>
                    </div>

                    {/* Actions: View, Edit Listing, Delete Listing */}
                    <div className="pt-3 border-t-2 border-black flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => onSelectProduct && onSelectProduct(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1F2438] text-black dark:text-white font-mono font-bold text-xs border border-black shadow-xs flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => setEditingProduct(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-black font-mono font-bold text-xs border border-black shadow-xs flex items-center space-x-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteListing(item._id)}
                        className="p-1.5 rounded-xl bg-white hover:bg-rose-100 text-rose-600 border border-black shadow-xs transition cursor-pointer"
                        title="Delete Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Incoming Reservation Requests */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#121522] border-3 border-black rounded-3xl p-8 shadow-brutal space-y-3 text-black dark:text-white">
              <Package className="w-12 h-12 mx-auto opacity-40 text-black dark:text-white" />
              <h3 className="font-display font-black text-base">No Reservation Requests Yet</h3>
              <p className="text-xs font-bold text-black/70 dark:text-slate-300 max-w-sm mx-auto">
                When another student reserves one of your campus listings, their request will appear here for you to accept or decline.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => {
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
                          <div className="flex items-center space-x-2">
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
                              {req.status === 'PENDING' ? '⏳ PENDING APPROVAL' : req.status}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-black/70 dark:text-slate-300 mt-0.5">
                            Received {new Date(req.createdAt).toLocaleDateString()}
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

                    {/* Buyer & Listing Details */}
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
                            Condition: {listing?.condition || 'Good'}
                          </div>
                          <div className="text-[11px] font-mono font-bold text-black dark:text-[#FFE600]">
                            ₹{listing?.price?.toLocaleString() || '0'} {req.quantity && req.quantity > 1 ? `(Qty: ${req.quantity})` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Buyer Details */}
                      <div className="p-3.5 rounded-2xl bg-[#F9FAFB] dark:bg-[#1F2438] border-2 border-black space-y-1">
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
                          {buyer?.branch || 'Engineering'} • {buyer?.year || 'Student'} ({buyer?.hostel || 'Hostel'})
                        </div>
                        {buyer?.phone && (
                          <div className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            📞 {buyer.phone}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pickup spot & notes */}
                    <div className="p-3 rounded-2xl bg-[#FEF08A]/30 dark:bg-[#2A2710] border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 shrink-0 text-black dark:text-[#FFE600]" />
                        <span className="font-bold">Proposed Pickup: </span>
                        <span className="font-mono font-black">{req.pickupLocation || 'Campus Hostel Gate'}</span>
                      </div>
                      {req.notes && (
                        <div className="text-black/80 dark:text-slate-300 italic font-mono text-[11px]">
                          Note: "{req.notes}"
                        </div>
                      )}
                    </div>

                    {/* Show Rejection or Cancellation Reason if present (Section 9) */}
                    {(req.status === 'REJECTED' || req.status === 'CANCELLED') && (req.cancellationReason || req.notes) && (
                      <div className="p-3 rounded-2xl bg-[#FF6B97]/20 border-2 border-black text-xs space-y-1">
                        <div className="font-display font-black text-rose-700 dark:text-rose-400">
                          Reason: "{req.cancellationReason || req.notes}"
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-2 border-t-2 border-black flex flex-wrap items-center justify-end gap-2.5">
                      {req.status === 'PENDING' && (
                        <>
                          <button
                            disabled={actionLoadingId === req._id}
                            onClick={() => handleDeclineRequest(req._id)}
                            className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border-2 border-black font-display font-black text-xs shadow-brutal-sm transition cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            disabled={actionLoadingId === req._id}
                            onClick={() => handleAccept(req._id)}
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
                            onClick={() => handleCancelAcceptedReservation(req._id)}
                            className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border-2 border-black font-display font-black text-xs shadow-brutal-sm transition cursor-pointer"
                          >
                            Cancel Reservation
                          </button>
                          <button
                            disabled={actionLoadingId === req._id}
                            onClick={() => handleComplete(req._id)}
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

      {/* Reject / Cancel Modal with reason input (Section 9) */}
      <RejectCancelModal
        isOpen={rejectModalState.isOpen}
        onClose={() => setRejectModalState({ isOpen: false, requestId: null, actionType: 'reject', title: '' })}
        title={rejectModalState.title}
        actionType={rejectModalState.actionType}
        loading={rejectSubmitting}
        onConfirm={handleConfirmRejectCancel}
      />

      {/* Create / Edit Listing Modal */}
      {(isCreateModalOpen || editingProduct) && (
        <CreateProductModal
          isOpen={isCreateModalOpen || Boolean(editingProduct)}
          productToEdit={editingProduct}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingProduct(null);
          }}
          onProductCreated={() => {
            setIsCreateModalOpen(false);
            fetchData();
          }}
          onProductUpdated={() => {
            setEditingProduct(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};
