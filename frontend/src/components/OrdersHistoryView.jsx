import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Truck,
  CheckCircle2,
  Store,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Check,
  X,
} from 'lucide-react';

export const OrdersHistoryView = ({ onGoToStore }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cancellation Modal State
  const [selectedOrderToCancel, setSelectedOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('Changed delivery address / mind');
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState(null);
  const [cancelError, setCancelError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getMyOrders();
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleCancelOrder = async () => {
    if (!selectedOrderToCancel) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await api.cancelOrder(selectedOrderToCancel._id, cancelReason);
      if (res.success) {
        setCancelMessage(`Order #${selectedOrderToCancel.orderNumber} successfully cancelled. Full refund processed.`);
        setSelectedOrderToCancel(null);
        fetchOrders();
        setTimeout(() => setCancelMessage(null), 5000);
      } else {
        setCancelError(res.message || 'Failed to cancel order.');
      }
    } catch (err) {
      setCancelError(err.message || 'Network error while cancelling order.');
    } finally {
      setCancelling(false);
    }
  };

  const isEligibleForCancellation = (order) => {
    if (order.paymentStatus === 'REFUNDED' || order.paymentStatus === 'CANCELLED') return false;
    return !order.vendorSubOrders?.some((sub) => sub.status === 'SHIPPED' || sub.status === 'DELIVERED');
  };

  const getTrackingStepIndex = (status) => {
    switch (status) {
      case 'PAID':
        return 1;
      case 'PROCESSING':
        return 2;
      case 'SHIPPED':
        return 3;
      case 'DELIVERED':
        return 4;
      case 'CANCELLED':
        return -1;
      default:
        return 1;
    }
  };

  const trackingSteps = [
    { title: 'Order Placed', desc: 'Payment verified' },
    { title: 'Processing', desc: 'Merchant packing' },
    { title: 'In Transit', desc: 'Carrier dispatch' },
    { title: 'Delivered', desc: 'Package arrived' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pop-in">
      {/* Header */}
      <div className="bg-[#FEF08A] border-3 border-black rounded-3xl p-6 sm:p-8 shadow-brutal-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-black text-white px-3 py-1 rounded-full text-xs font-mono font-bold">
            <span>LIVE PACKAGE TRACKING</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-black mt-2">
            My Orders & Shipments
          </h1>
          <p className="text-xs sm:text-sm font-bold text-black/80 mt-1">
            Real-time visual tracking steppers, carrier dispatch status, and self-service cancellations
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="neo-btn-secondary text-xs flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {cancelMessage && (
        <div className="p-4 rounded-2xl bg-[#6EE7B7] border-3 border-black text-xs font-black text-black flex items-center space-x-2 shadow-brutal animate-pop-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{cancelMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border-3 border-black rounded-3xl p-6 h-48 animate-pulse shadow-brutal" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white border-3 border-black rounded-3xl p-8 shadow-brutal space-y-3">
          <ShoppingBag className="w-10 h-10 text-black mx-auto" />
          <h3 className="text-base font-display font-black text-black">No Orders Placed Yet</h3>
          <p className="text-xs font-bold text-black/70 max-w-sm mx-auto">
            Place an order from verified merchants in the marketplace to track fulfillment here.
          </p>
          <button
            onClick={onGoToStore}
            className="neo-btn-primary text-xs inline-flex items-center space-x-1.5 mt-2"
          >
            <span>Browse Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const cancellable = isEligibleForCancellation(order);
            const isCancelled = order.paymentStatus === 'REFUNDED' || order.paymentStatus === 'CANCELLED';

            const orderDate = new Date(order.createdAt);
            const estDelivery = new Date(orderDate);
            estDelivery.setDate(estDelivery.getDate() + 3);

            return (
              <div key={order._id} className="bg-white border-3 border-black rounded-3xl p-6 shadow-brutal space-y-5">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-4">
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <span className="text-base font-mono font-black text-black">#{order.orderNumber}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg border-2 border-black text-xs font-black font-mono shadow-xs ${
                          isCancelled
                            ? 'bg-[#FF6B97] text-white'
                            : order.paymentStatus === 'PAID'
                            ? 'bg-[#6EE7B7] text-black'
                            : 'bg-[#FEF08A] text-black'
                        }`}
                      >
                        {isCancelled ? 'CANCELLED / REFUNDED' : order.paymentStatus}
                      </span>
                      <span className="text-xs font-mono font-bold text-black bg-[#F3F4F6] px-2 py-0.5 rounded border border-black">
                        {order.paymentMethod?.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs font-mono font-bold text-black/70 mt-1 flex items-center space-x-3">
                      <span>Placed: {orderDate.toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1 text-black font-black">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Est. Delivery: {estDelivery.toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4">
                    <div className="text-right">
                      <div className="text-lg font-mono font-black text-black bg-[#FEF08A] px-2.5 py-0.5 rounded-lg border-2 border-black shadow-xs inline-block">
                        ${order.totalAmount?.toFixed(2)}
                      </div>
                      <div className="text-[10px] font-mono font-bold text-black/70 mt-0.5">
                        {order.vendorSubOrders?.length} Vendor Fulfillments
                      </div>
                    </div>

                    {cancellable && (
                      <button
                        onClick={() => {
                          setSelectedOrderToCancel(order);
                          setCancelError(null);
                        }}
                        className="px-3 py-1.5 rounded-xl border-2 border-black bg-[#FF6B97] hover:bg-[#F43F5E] text-white text-xs font-display font-black flex items-center space-x-1.5 shadow-brutal-sm hover:translate-x-[-1px] transition"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-orders Partitioned View with Live Stepper */}
                <div className="space-y-4">
                  <div className="text-[11px] font-mono uppercase font-black text-black">
                    Vendor Dispatches & Delivery Timeline:
                  </div>

                  <div className="space-y-4">
                    {order.vendorSubOrders?.map((vso, idx) => {
                      const stepIdx = getTrackingStepIndex(vso.status);

                      return (
                        <div key={idx} className="p-4 rounded-2xl bg-[#F9FAFB] border-2 border-black shadow-brutal-sm space-y-4">
                          {/* Sub-order Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-2 text-xs">
                            <div className="flex items-center space-x-2">
                              <Store className="w-4 h-4 text-black" />
                              <span className="font-display font-black text-black text-sm">{vso.store?.name || 'Store Merchant'}</span>
                              <span className="font-mono font-bold text-black text-xs">
                                (${vso.subTotal?.toFixed(2)})
                              </span>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-lg border-2 border-black text-xs font-mono font-black ${
                                vso.status === 'DELIVERED'
                                  ? 'bg-[#6EE7B7] text-black'
                                  : vso.status === 'SHIPPED'
                                  ? 'bg-[#C4B5FD] text-black'
                                  : vso.status === 'CANCELLED'
                                  ? 'bg-[#FF6B97] text-white'
                                  : 'bg-[#FEF08A] text-black'
                              }`}
                            >
                              {vso.status}
                            </span>
                          </div>

                          {/* Visual Tracking Stepper Bar */}
                          {vso.status !== 'CANCELLED' && (
                            <div className="py-3 px-2">
                              <div className="relative flex items-center justify-between">
                                {/* Connecting Background Track */}
                                <div className="absolute top-1/2 left-0 right-0 h-1 bg-black -translate-y-1/2 z-0" />
                                
                                {/* Active Progress Track */}
                                <div
                                  className="absolute top-1/2 left-0 h-1 bg-[#6EE7B7] -translate-y-1/2 z-0 transition-all duration-500"
                                  style={{
                                    width: `${((stepIdx - 1) / 3) * 100}%`,
                                  }}
                                />

                                {trackingSteps.map((s, sIdx) => {
                                  const isComplete = stepIdx > sIdx + 1;
                                  const isCurrent = stepIdx === sIdx + 1;

                                  return (
                                    <div key={sIdx} className="relative z-10 flex flex-col items-center">
                                      <div
                                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black font-mono border-2 border-black transition ${
                                          isComplete
                                            ? 'bg-[#6EE7B7] text-black shadow-brutal-sm'
                                            : isCurrent
                                            ? 'bg-[#FEF08A] text-black shadow-brutal scale-110'
                                            : 'bg-white text-black/40'
                                        }`}
                                      >
                                        {isComplete ? <Check className="w-4 h-4 text-black stroke-[3]" /> : sIdx + 1}
                                      </div>
                                      <div className="text-center mt-2">
                                        <div className={`text-xs font-display font-black ${isCurrent ? 'text-black underline' : isComplete ? 'text-black' : 'text-black/40'}`}>
                                          {s.title}
                                        </div>
                                        <div className="text-[10px] font-bold text-black/60 hidden sm:block">{s.desc}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Carrier Tracking Badge */}
                          {vso.trackingNumber && (
                            <div className="p-3 rounded-xl bg-white border-2 border-black flex items-center justify-between text-xs font-mono shadow-xs">
                              <div className="flex items-center space-x-2">
                                <Truck className="w-4 h-4 text-black" />
                                <span className="font-bold text-black">{vso.carrier || 'Courier Express'}:</span>
                                <span className="font-black text-black">{vso.trackingNumber}</span>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-[#6EE7B7] text-black font-black text-[10px] border border-black">
                                Live Tracking Sync
                              </span>
                            </div>
                          )}

                          {/* Items in this sub-order */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                            {vso.items?.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex items-center justify-between p-2.5 rounded-xl bg-white border-2 border-black shadow-xs">
                                <div className="flex items-center space-x-2.5">
                                  <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-9 h-9 rounded-lg object-cover border border-black"
                                  />
                                  <span className="font-display font-bold text-black line-clamp-1 max-w-[150px]">{item.title}</span>
                                </div>
                                <span className="font-mono font-bold text-black text-xs">
                                  {item.quantity}x • ${item.price.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CANCEL ORDER MODAL */}
      {selectedOrderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-pop-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedOrderToCancel(null)} />

          <div className="relative w-full max-w-md bg-white border-3 border-black rounded-3xl shadow-brutal-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-black" />
                <h3 className="text-base font-display font-black text-black">Cancel Order #{selectedOrderToCancel.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrderToCancel(null)}
                className="p-1.5 rounded-xl bg-white border-2 border-black shadow-brutal-sm hover:bg-[#FF6B97] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cancelError && (
              <div className="p-3 rounded-xl bg-[#FF6B97]/20 border-2 border-black text-black text-xs font-bold flex items-center space-x-2 shadow-brutal-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs font-bold text-black">
              <p className="leading-relaxed">
                Are you sure you want to cancel this order? An automatic 100% refund of <strong className="font-mono bg-[#FEF08A] px-1 py-0.5 rounded border border-black">${selectedOrderToCancel.totalAmount?.toFixed(2)}</strong> will be processed and reserved items will be put back in store inventory.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-black">Reason for Cancellation</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black text-black text-xs shadow-brutal-sm focus:bg-[#FEFCE8]"
                >
                  <option value="Changed delivery address / mind">Changed delivery address / mind</option>
                  <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Delivery speed not fast enough">Delivery speed not fast enough</option>
                  <option value="Other / Duplicate order">Other / Duplicate order</option>
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-[#6EE7B7] border-2 border-black space-y-1 text-xs text-black shadow-brutal-sm">
                <div className="flex items-center space-x-1.5 font-black">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Instant Stock Restoration</span>
                </div>
                <p className="text-[11px] font-semibold opacity-90">
                  All {selectedOrderToCancel.items?.length} items will be atomically returned to active merchant catalog.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-2.5">
              <button
                type="button"
                onClick={() => setSelectedOrderToCancel(null)}
                className="flex-1 py-2.5 rounded-xl bg-white border-2 border-black text-black font-display font-black text-xs shadow-brutal-sm hover:bg-slate-100"
              >
                Keep Order
              </button>

              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="flex-1 py-2.5 rounded-xl bg-[#FF6B97] hover:bg-[#F43F5E] text-white font-display font-black text-xs border-2 border-black shadow-brutal flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
              >
                {cancelling ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Confirm Cancel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
