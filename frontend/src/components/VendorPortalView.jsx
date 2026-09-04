import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CreateProductModal } from './CreateProductModal';
import {
  Store,
  DollarSign,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  Truck,
  Plus,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export const VendorPortalView = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [trackingInputs, setTrackingInputs] = useState({});

  const fetchVendorData = async () => {
    setLoading(true);
    try {
      const [dashRes, ordersRes] = await Promise.all([
        api.getVendorDashboard(),
        api.getVendorSubOrders(),
      ]);

      if (dashRes.success) setDashboard(dashRes);
      if (ordersRes.success) setSubOrders(ordersRes.subOrders || []);
    } catch (err) {
      console.error('Fetch vendor data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, [user]);

  const handleUpdateStatus = async (orderId, subOrderId, nextStatus) => {
    setUpdatingId(subOrderId);
    try {
      const tracking = trackingInputs[subOrderId] || {};
      const res = await api.updateSubOrderStatus(orderId, subOrderId, {
        status: nextStatus,
        carrier: tracking.carrier || 'Courier Express',
        trackingNumber: tracking.trackingNumber || `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      });

      if (res.success) {
        fetchVendorData();
      }
    } catch (err) {
      console.error('Update status failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (user?.role !== 'vendor' && user?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center bg-white border-3 border-black rounded-3xl p-8 shadow-brutal space-y-3">
        <ShieldAlert className="w-12 h-12 text-black mx-auto" />
        <h2 className="text-lg font-display font-black text-black">Vendor Access Restricted</h2>
        <p className="text-xs font-bold text-black/70 max-w-sm mx-auto">
          This portal is reserved for merchant store owners to manage catalogs and order fulfillments.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pop-in">
      {/* Header */}
      <div className="bg-[#6EE7B7] border-3 border-black rounded-3xl p-6 sm:p-8 shadow-brutal-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-black text-white text-xs font-mono font-black">VENDOR HUB</span>
            <span className="text-xs font-mono font-bold text-black bg-white px-2 py-0.5 rounded border border-black">
              Take-Rate: {((dashboard?.store?.commissionRate || 0.1) * 100).toFixed(0)}%
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-black mt-2">
            {dashboard?.store?.name || 'My Store Workspace'}
          </h1>
          <p className="text-xs sm:text-sm font-bold text-black/80 mt-1">
            Real-time sub-order fulfillment pipeline, catalog management, and earnings
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsAddProductOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-black font-display font-black text-xs border-2.5 border-black shadow-brutal flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>

          <button
            onClick={fetchVendorData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border-2.5 border-black shadow-brutal hover:bg-slate-100 transition text-black"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bento KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#FEF08A] border-3 border-black rounded-2xl p-5 shadow-brutal space-y-1">
          <div className="text-[11px] font-mono uppercase font-black text-black">Settled Balance</div>
          <div className="text-2xl font-black font-mono text-black">
            ${(dashboard?.stats?.currentBalance || 0).toFixed(2)}
          </div>
          <div className="text-[10px] font-mono font-bold text-black/70">Available for payout</div>
        </div>

        <div className="bg-[#FFFFFF] border-3 border-black rounded-2xl p-5 shadow-brutal space-y-1">
          <div className="text-[11px] font-mono uppercase font-black text-black">Lifetime GMV</div>
          <div className="text-2xl font-black font-mono text-black">
            ${(dashboard?.stats?.lifetimeSales || 0).toFixed(2)}
          </div>
          <div className="text-[10px] font-mono font-bold text-black/70">From customer orders</div>
        </div>

        <div className="bg-[#FF6B97] text-white border-3 border-black rounded-2xl p-5 shadow-brutal space-y-1">
          <div className="text-[11px] font-mono uppercase font-black text-white">Pending Orders</div>
          <div className="text-2xl font-black font-mono text-white">
            {dashboard?.stats?.pendingFulfillment || 0}
          </div>
          <div className="text-[10px] font-mono font-bold text-white/90">Requires dispatch</div>
        </div>

        <div className="bg-[#C4B5FD] border-3 border-black rounded-2xl p-5 shadow-brutal space-y-1">
          <div className="text-[11px] font-mono uppercase font-black text-black">Active Products</div>
          <div className="text-2xl font-black font-mono text-black">
            {dashboard?.stats?.productCount || 0}
          </div>
          <div className="text-[10px] font-mono font-bold text-black/70">Indexed in catalog</div>
        </div>
      </div>

      {/* Fulfillment Pipeline */}
      <div className="bg-white border-3 border-black rounded-3xl p-6 shadow-brutal-xl space-y-5">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div>
            <h2 className="text-lg font-display font-black text-black">Fulfillment Pipeline</h2>
            <p className="text-xs font-bold text-black/70">Routed sub-orders requiring merchant packaging & dispatch</p>
          </div>
          <span className="text-xs font-mono font-black bg-[#FEF08A] px-3 py-1 rounded-xl border-2 border-black">{subOrders.length} Sub-Orders</span>
        </div>

        {subOrders.length === 0 ? (
          <div className="text-center py-12 text-black space-y-2">
            <Package className="w-10 h-10 mx-auto opacity-40" />
            <p className="font-display font-black text-sm">No incoming orders for this store right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subOrders.map((so) => (
              <div
                key={so._id}
                className="p-5 rounded-2xl bg-[#F9FAFB] border-2.5 border-black shadow-brutal space-y-4 text-xs font-bold text-black"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono font-black">Order #{so.orderNumber}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg border-2 border-black text-xs font-mono font-black ${
                          so.status === 'DELIVERED'
                            ? 'bg-[#6EE7B7]'
                            : so.status === 'SHIPPED'
                            ? 'bg-[#C4B5FD]'
                            : so.status === 'CANCELLED'
                            ? 'bg-[#FF6B97] text-white'
                            : 'bg-[#FEF08A]'
                        }`}
                      >
                        {so.status}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-black/70">
                      Customer: {so.customerInfo?.name} ({so.customerInfo?.city}, {so.customerInfo?.postalCode})
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-base font-black">${so.subTotal?.toFixed(2)}</div>
                    <div className="text-[10px] text-black/70">
                      Payout: <span className="font-bold text-black">${so.vendorPayout?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {so.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white border-2 border-black">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-8 h-8 rounded-lg object-cover border border-black"
                        />
                        <span className="font-display font-bold line-clamp-1 max-w-[140px]">{item.title}</span>
                      </div>
                      <span className="font-mono text-xs font-black">
                        {item.quantity}x • ${item.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* State Machine Transition Buttons */}
                <div className="pt-3 border-t-2 border-black flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 text-xs font-mono">
                    <span className="text-black/70 font-bold">Tracking:</span>
                    <span className="font-black bg-white px-2 py-0.5 rounded border border-black">
                      {so.trackingNumber || 'Awaiting dispatch'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {so.status === 'PAID' && (
                      <button
                        disabled={updatingId === so._id}
                        onClick={() => handleUpdateStatus(so.orderId, so._id, 'PROCESSING')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-black font-display font-black border-2 border-black shadow-brutal-sm"
                      >
                        Start Packing
                      </button>
                    )}

                    {so.status === 'PROCESSING' && (
                      <button
                        disabled={updatingId === so._id}
                        onClick={() => handleUpdateStatus(so.orderId, so._id, 'SHIPPED')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#C4B5FD] hover:bg-[#A78BFA] text-black font-display font-black border-2 border-black shadow-brutal-sm"
                      >
                        Dispatch Carrier
                      </button>
                    )}

                    {so.status === 'SHIPPED' && (
                      <button
                        disabled={updatingId === so._id}
                        onClick={() => handleUpdateStatus(so.orderId, so._id, 'DELIVERED')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#6EE7B7] hover:bg-[#34D399] text-black font-display font-black border-2 border-black shadow-brutal-sm"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <CreateProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onProductCreated={() => {
          setIsAddProductOpen(false);
          fetchVendorData();
        }}
      />
    </div>
  );
};
