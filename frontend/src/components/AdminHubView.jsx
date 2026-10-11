import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  ShieldAlert,
  RefreshCw,
  Users,
  Package,
  Trash2,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
} from 'lucide-react';

export const AdminHubView = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'listings'
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, productsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(1, 50),
        api.getAdminProducts(1, 50),
      ]);

      if (statsRes.success) setStats(statsRes.stats || statsRes.kpis || {});
      if (usersRes.success) setUsersList(usersRes.users || []);
      if (productsRes.success) setProductsList(productsRes.products || []);
    } catch (err) {
      console.error('Fetch admin data failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role?.toUpperCase() === 'ADMIN') {
      fetchAdminData();
    }
  }, [user]);

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove user "${userName}"?`)) return;
    setActionLoadingId(userId);
    try {
      const res = await api.deleteAdminUser(userId);
      if (res.success) {
        showNotification(`User "${userName}" removed successfully.`);
        setUsersList((prev) => prev.filter((u) => u._id !== userId));
        fetchAdminData();
      } else {
        alert(res.message || 'Failed to remove user.');
      }
    } catch (err) {
      alert(err.message || 'Error deleting user.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteProduct = async (productId, productTitle) => {
    if (!window.confirm(`Are you sure you want to remove listing "${productTitle}"?`)) return;
    setActionLoadingId(productId);
    try {
      const res = await api.deleteAdminProduct(productId);
      if (res.success) {
        showNotification(`Listing "${productTitle}" removed successfully.`);
        setProductsList((prev) => prev.filter((p) => p._id !== productId));
        fetchAdminData();
      } else {
        alert(res.message || 'Failed to remove listing.');
      }
    } catch (err) {
      alert(err.message || 'Error deleting listing.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (user?.role?.toUpperCase() !== 'ADMIN') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center bg-white dark:bg-[#121522] border-3 border-black rounded-3xl p-8 shadow-brutal space-y-3">
        <ShieldAlert className="w-12 h-12 text-black dark:text-white mx-auto" />
        <h2 className="text-lg font-display font-black text-black dark:text-white">Access Restricted</h2>
        <p className="text-xs font-bold text-black/70 dark:text-slate-300 max-w-sm mx-auto">
          This section is strictly accessible to CampusExchange Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pop-in">
      {/* Admin Header */}
      <div className="bg-[#FEF08A] dark:bg-[#FFE600] border-3 border-black rounded-3xl p-6 sm:p-8 shadow-brutal-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-black">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-black text-white text-xs font-mono font-black">
              CAMPUS ADMIN CONSOLE
            </span>
            <span className="text-xs font-mono font-bold text-black bg-white px-2 py-0.5 rounded border border-black">
              ★ MNIT Jaipur
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight mt-2 text-black">
            Marketplace Administration
          </h1>
          <p className="text-xs font-bold font-mono text-black/80 mt-1">
            Moderate listings, view student accounts, and inspect campus exchange volume.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border-2.5 border-black font-mono font-black text-xs shadow-brutal hover:translate-x-[-1px] transition flex items-center space-x-2 cursor-pointer disabled:opacity-50 text-black"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {notification && (
        <div className="p-3.5 rounded-2xl bg-[#6EE7B7] border-2 border-black font-mono text-xs font-black text-black shadow-brutal flex items-center space-x-2 animate-pop-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex space-x-2 bg-white dark:bg-[#121522] p-2 rounded-2xl border-3 border-black shadow-brutal">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-display font-black border-2 border-black transition cursor-pointer flex items-center justify-center space-x-2 ${
            activeTab === 'overview'
              ? 'bg-[#FEF08A] dark:bg-[#FFE600] text-black shadow-brutal-sm'
              : 'bg-transparent border-transparent text-black dark:text-white hover:bg-slate-100 dark:hover:bg-[#1A1E30]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Marketplace Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-display font-black border-2 border-black transition cursor-pointer flex items-center justify-center space-x-2 ${
            activeTab === 'users'
              ? 'bg-[#6EE7B7] dark:bg-[#00FF87] text-black shadow-brutal-sm'
              : 'bg-transparent border-transparent text-black dark:text-white hover:bg-slate-100 dark:hover:bg-[#1A1E30]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Accounts ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('listings')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-display font-black border-2 border-black transition cursor-pointer flex items-center justify-center space-x-2 ${
            activeTab === 'listings'
              ? 'bg-[#C4B5FD] dark:bg-[#B026FF] text-black dark:text-white shadow-brutal-sm'
              : 'bg-transparent border-transparent text-black dark:text-white hover:bg-slate-100 dark:hover:bg-[#1A1E30]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Campus Listings ({productsList.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-pop-in">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#161A2B] text-black dark:text-white border-3 border-black rounded-2xl p-5 shadow-brutal space-y-1">
              <div className="text-[11px] font-mono uppercase font-black text-black/60 dark:text-slate-400">
                Registered Students
              </div>
              <div className="text-3xl font-black font-mono">
                {stats?.totalUsers ?? usersList.length}
              </div>
              <div className="text-[10px] font-mono font-bold text-black/70 dark:text-slate-400">
                {stats?.totalBuyers ?? 2} Buyers • {stats?.totalSellers ?? 2} Sellers
              </div>
            </div>

            <div className="bg-[#6EE7B7] text-black border-3 border-black rounded-2xl p-5 shadow-brutal space-y-1">
              <div className="text-[11px] font-mono uppercase font-black text-black">
                Active Listings
              </div>
              <div className="text-3xl font-black font-mono">
                {stats?.availableListings ?? stats?.activeListings ?? 6}
              </div>
              <div className="text-[10px] font-mono font-bold text-black/80">
                AVAILABLE for peer pickup
              </div>
            </div>

            <div className="bg-[#FEF08A] text-black border-3 border-black rounded-2xl p-5 shadow-brutal space-y-1">
              <div className="text-[11px] font-mono uppercase font-black text-black">
                Reserved / In Progress
              </div>
              <div className="text-3xl font-black font-mono">
                {stats?.reservedListings ?? stats?.itemsReserved ?? 1}
              </div>
              <div className="text-[10px] font-mono font-bold text-black/80">
                Hand-off pending meetup
              </div>
            </div>

            <div className="bg-[#FF6B97] text-white border-3 border-black rounded-2xl p-5 shadow-brutal space-y-1">
              <div className="text-[11px] font-mono uppercase font-black text-white">
                Completed Exchanges
              </div>
              <div className="text-3xl font-black font-mono">
                {stats?.soldListings ?? stats?.completedExchanges ?? 1}
              </div>
              <div className="text-[10px] font-mono font-bold text-white/90">
                Successfully handed off between students
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white dark:bg-[#121522] border-3 border-black rounded-3xl p-6 shadow-brutal-xl space-y-4 text-black dark:text-white">
            <div className="border-b-2 border-black pb-3">
              <h2 className="text-lg font-display font-black">Campus Catalog Distribution</h2>
              <p className="text-xs font-bold text-black/70 dark:text-slate-300">Available listings by category</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(stats?.categoryDistribution || [
                { _id: 'Calculators', count: 1 },
                { _id: 'Electronics', count: 1 },
                { _id: 'Sports equipment', count: 2 },
                { _id: 'Books', count: 1 },
                { _id: 'Furniture', count: 1 },
                { _id: 'Other useful student items', count: 1 },
              ]).map((cat, idx) => {
                const colors = ['bg-[#FEF08A]', 'bg-[#6EE7B7]', 'bg-[#C4B5FD]', 'bg-[#67E8F9]', 'bg-[#FFB74D]'];
                return (
                  <div
                    key={cat._id || idx}
                    className={`p-3.5 rounded-2xl ${colors[idx % colors.length]} border-2 border-black shadow-xs flex items-center justify-between text-xs font-bold text-black`}
                  >
                    <span className="font-display font-black truncate">{cat._id}</span>
                    <span className="font-mono font-black bg-white px-2.5 py-0.5 rounded-lg border border-black shrink-0">
                      {cat.count} listings
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: USERS LIST ─── */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-[#121522] border-3 border-black rounded-3xl p-6 shadow-brutal-xl space-y-4 text-black dark:text-white animate-pop-in">
          <div className="border-b-2 border-black pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-black">Registered Campus Users</h2>
              <p className="text-xs font-bold text-black/70 dark:text-slate-300">
                Verified student accounts eligible for campus peer exchange
              </p>
            </div>
            <span className="text-xs font-mono font-black bg-[#FEF08A] text-black px-3 py-1 rounded-xl border-2 border-black">
              {usersList.length} Students
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-black bg-slate-50 dark:bg-[#1A1E30] font-mono text-black dark:text-slate-300">
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Hostel / Campus Spot</th>
                  <th className="p-3">Branch & Year</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/20 dark:divide-white/10 font-medium">
                {usersList.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-[#1A1E30] transition">
                    <td className="p-3 font-bold font-display text-sm">{u.name}</td>
                    <td className="p-3 font-mono text-[11px] opacity-80">{u.email}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-lg border border-black text-[10px] font-mono font-black ${
                          u.role === 'ADMIN'
                            ? 'bg-[#FEF08A] text-black'
                            : u.role === 'SELLER'
                            ? 'bg-[#6EE7B7] text-black'
                            : 'bg-[#C4B5FD] text-black'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px]">{u.hostel || 'Hostel 5'}</td>
                    <td className="p-3 text-[11px] opacity-80">{u.branch || 'CSE'} ({u.year || 'Student'})</td>
                    <td className="p-3 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          disabled={actionLoadingId === u._id}
                          onClick={() => handleDeleteUser(u._id, u.name)}
                          className="px-3 py-1 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-black font-mono font-bold text-xs shadow-xs transition cursor-pointer"
                        >
                          {actionLoadingId === u._id ? 'Removing...' : 'Remove'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: LISTINGS MODERATION ─── */}
      {activeTab === 'listings' && (
        <div className="bg-white dark:bg-[#121522] border-3 border-black rounded-3xl p-6 shadow-brutal-xl space-y-4 text-black dark:text-white animate-pop-in">
          <div className="border-b-2 border-black pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-black">All Campus Listings</h2>
              <p className="text-xs font-bold text-black/70 dark:text-slate-300">
                Review and moderate items posted by student sellers
              </p>
            </div>
            <span className="text-xs font-mono font-black bg-[#C4B5FD] text-black px-3 py-1 rounded-xl border-2 border-black">
              {productsList.length} Items Listed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-black bg-slate-50 dark:bg-[#1A1E30] font-mono text-black dark:text-slate-300">
                  <th className="p-3">Item</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Seller</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Moderate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/20 dark:divide-white/10 font-medium">
                {productsList.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-[#1A1E30] transition">
                    <td className="p-3 font-bold font-display text-sm">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80'}
                          alt={p.title}
                          className="w-10 h-10 rounded-lg object-cover border border-black shrink-0"
                        />
                        <span className="line-clamp-1">{p.title}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[11px]">{p.category}</td>
                    <td className="p-3 font-mono font-black text-black dark:text-[#FFE600]">₹{p.price?.toLocaleString()}</td>
                    <td className="p-3 text-[11px]">{p.seller?.name || 'Student'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-lg border border-black text-[10px] font-mono font-black ${
                          p.status === 'AVAILABLE'
                            ? 'bg-[#6EE7B7] text-black'
                            : p.status === 'RESERVED'
                            ? 'bg-[#FEF08A] text-black'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        disabled={actionLoadingId === p._id}
                        onClick={() => handleDeleteProduct(p._id, p.title)}
                        className="px-3 py-1 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-black font-mono font-bold text-xs shadow-xs transition cursor-pointer flex items-center space-x-1 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{actionLoadingId === p._id ? 'Removing...' : 'Delete'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
