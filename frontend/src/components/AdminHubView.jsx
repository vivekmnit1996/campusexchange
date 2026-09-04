import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  ShieldAlert,
  RefreshCw,
  Zap,
  TrendingUp,
  Store,
  ArrowUpRight,
} from 'lucide-react';

export const AdminHubView = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, logsRes] = await Promise.all([
        api.getPlatformAnalytics(),
        api.getWebhookLogs(),
      ]);

      if (analyticsRes.success) setAnalytics(analyticsRes);
      if (logsRes.success) setWebhookLogs(logsRes.logs || []);
    } catch (err) {
      console.error('Fetch admin analytics failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center bg-white border-3 border-black rounded-3xl p-8 shadow-brutal space-y-3">
        <ShieldAlert className="w-12 h-12 text-black mx-auto" />
        <h2 className="text-lg font-display font-black text-black">Access Restricted</h2>
        <p className="text-xs font-bold text-black/70 max-w-sm mx-auto">
          This section is only accessible to platform administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pop-in">
      {/* Header */}
      <div className="bg-[#FEF08A] border-3 border-black rounded-3xl p-6 sm:p-8 shadow-brutal-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-black text-white text-xs font-mono font-black">ADMIN CONSOLE</span>
            <span className="text-xs font-mono font-bold text-black bg-white px-2 py-0.5 rounded border border-black">
              Live Aggregate Metrics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-black mt-2">
            Platform Performance & Revenue
          </h1>
          <p className="text-xs sm:text-sm font-bold text-black/80 mt-1">
            Real-time financial reconciliation, merchant distribution, and payment gateway logs
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="neo-btn-secondary text-xs flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Updating...' : 'Refresh'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#FFFFFF] border-3 border-black rounded-2xl p-5 shadow-brutal space-y-1">
          <div className="text-[11px] font-mono uppercase font-black text-black">Gross GMV</div>
          <div className="text-2xl font-black font-mono text-black">
            ${(analytics?.kpis?.totalGMV || 0).toFixed(2)}
          </div>
          <div className="text-[10px] font-mono font-bold text-black/70">{analytics?.kpis?.orderCount || 0} Completed Orders</div>
        </div>

        <div className="bg-[#6EE7B7] border-3 border-black rounded-2xl p-5 shadow-brutal space-y-1">
          <div className="text-[11px] font-mono uppercase font-black text-black">Platform Revenue</div>
          <div className="text-2xl font-black font-mono text-black">
            ${(analytics?.kpis?.totalPlatformRevenue || 0).toFixed(2)}
          </div>
          <div className="text-[10px] font-mono font-bold text-black/80">Retained Commission Take</div>
        </div>

        <div className="bg-[#C4B5FD] border-3 border-black rounded-2xl p-5 shadow-brutal space-y-1">
          <div className="text-[11px] font-mono uppercase font-black text-black">Vendor Settlements</div>
          <div className="text-2xl font-black font-mono text-black">
            ${(analytics?.kpis?.totalVendorPayouts || 0).toFixed(2)}
          </div>
          <div className="text-[10px] font-mono font-bold text-black/70">Credited to merchants</div>
        </div>

        <div className="bg-[#FF6B97] text-white border-3 border-black rounded-2xl p-5 shadow-brutal space-y-1">
          <div className="text-[11px] font-mono uppercase font-black text-white">Average Order Value</div>
          <div className="text-2xl font-black font-mono text-white">
            ${(analytics?.kpis?.avgOrderValue || 0).toFixed(2)}
          </div>
          <div className="text-[10px] font-mono font-bold text-white/90">Per customer checkout</div>
        </div>
      </div>

      {/* Leaderboard & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendor Leaderboard */}
        <div className="lg:col-span-2 bg-white border-3 border-black rounded-3xl p-6 shadow-brutal-xl space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div>
              <h2 className="text-lg font-display font-black text-black">Top Performing Vendors</h2>
              <p className="text-xs font-bold text-black/70">Ranked by gross sales volume and fulfillment count</p>
            </div>
            <span className="text-xs font-mono font-black bg-[#FEF08A] px-3 py-1 rounded-xl border-2 border-black">
              {analytics?.vendorLeaderboard?.length || 0} Stores
            </span>
          </div>

          <div className="space-y-3">
            {(!analytics?.vendorLeaderboard || analytics.vendorLeaderboard.length === 0) ? (
              <div className="text-center py-8 text-black font-bold text-xs">No vendor activity recorded yet.</div>
            ) : (
              analytics.vendorLeaderboard.map((v, i) => (
                <div
                  key={v.storeId}
                  className="p-4 rounded-2xl bg-[#F9FAFB] border-2 border-black shadow-brutal-sm flex items-center justify-between text-xs font-bold text-black hover:bg-[#FEFCE8] transition"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-xl bg-[#FEF08A] border-2 border-black flex items-center justify-center font-mono text-black font-black text-xs">
                      #{i + 1}
                    </span>
                    <div>
                      <div className="font-display font-black text-black text-sm">{v.storeName}</div>
                      <div className="text-[11px] font-mono text-black/70">{v.subOrderCount} Sub-orders fulfilled</div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="font-black text-black text-sm">${v.totalSales.toFixed(2)}</div>
                    <div className="text-[10px] text-black/70">Cut: ${v.totalFeePaid.toFixed(2)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Catalog Categories */}
        <div className="bg-white border-3 border-black rounded-3xl p-6 shadow-brutal-xl space-y-4">
          <div className="border-b-2 border-black pb-3">
            <h2 className="text-lg font-display font-black text-black">Catalog Distribution</h2>
            <p className="text-xs font-bold text-black/70">Products by category</p>
          </div>

          <div className="space-y-2.5">
            {(!analytics?.categoryBreakdown || analytics.categoryBreakdown.length === 0) ? (
              <div className="text-center py-8 text-black font-bold text-xs">No categories indexed.</div>
            ) : (
              analytics.categoryBreakdown.map((cat, idx) => {
                const colors = ['bg-[#FEF08A]', 'bg-[#6EE7B7]', 'bg-[#C4B5FD]', 'bg-[#67E8F9]'];
                return (
                  <div
                    key={cat._id}
                    className={`p-3 rounded-2xl ${colors[idx % colors.length]} border-2 border-black shadow-xs flex items-center justify-between text-xs font-bold text-black`}
                  >
                    <span className="font-display font-black">{cat._id}</span>
                    <span className="font-mono font-black bg-white px-2 py-0.5 rounded border border-black">{cat.count} SKUs</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Webhook Ingress Audit Logs */}
      <div className="bg-white border-3 border-black rounded-3xl p-6 shadow-brutal-xl space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-black" />
            <div>
              <h2 className="text-lg font-display font-black text-black">Payment Gateway Webhook Ingress</h2>
              <p className="text-xs font-bold text-black/70">Cryptographically verified HMAC-SHA256 events</p>
            </div>
          </div>
          <span className="text-xs font-mono font-black bg-[#6EE7B7] px-3 py-1 rounded-xl border-2 border-black">{webhookLogs.length} Events</span>
        </div>

        {webhookLogs.length === 0 ? (
          <div className="text-xs font-mono text-black font-bold py-6 text-center">No webhook ingress events logged.</div>
        ) : (
          <div className="space-y-2 overflow-x-auto">
            {webhookLogs.map((log) => (
              <div
                key={log._id}
                className="p-3.5 rounded-2xl bg-[#F9FAFB] border-2 border-black text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono font-bold text-black shadow-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-lg border-2 border-black text-[11px] font-black ${
                      log.status === 'PROCESSED' ? 'bg-[#6EE7B7]' : 'bg-[#FF6B97] text-white'
                    }`}
                  >
                    {log.status}
                  </span>
                  <span className="text-black text-xs font-black">{log.eventId}</span>
                  <span className="text-black/60 text-[11px]">({log.eventType})</span>
                </div>
                <div className="flex items-center space-x-3 text-[11px] text-black/70">
                  <span className="bg-white px-2 py-0.5 rounded border border-black">HMAC-SHA256: Verified</span>
                  <span>•</span>
                  <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
