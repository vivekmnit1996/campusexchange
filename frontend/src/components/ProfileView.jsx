import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  User,
  GraduationCap,
  Building,
  Calendar,
  Home,
  Mail,
  Phone,
  CheckCircle2,
  Edit3,
  Save,
  LogOut,
  Sparkles,
} from 'lucide-react';

export const ProfileView = ({ onNavigateToMarketplace, onNavigateToListings }) => {
  const { user, login, logout, setUser, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    college: user?.college || 'MNIT Jaipur',
    branch: user?.branch || 'Computer Science & Engineering',
    year: user?.year || '3rd Year',
    hostel: user?.hostel || 'Hostel 5',
    phone: user?.phone || '',
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await api.updateProfile(formData);
      if (res.success) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
        // Update user context in localStorage
        const stored = localStorage.getItem('campus_user') || localStorage.getItem('mp_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = { ...parsed, ...formData };
          localStorage.setItem('campus_user', JSON.stringify(updated));
        }
      } else {
        setError(res.message || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pop-in">
      {/* Header Banner */}
      <div className="bg-[#FEF08A] dark:bg-[#FFE600] border-3 border-black rounded-3xl p-6 sm:p-8 shadow-brutal-xl text-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-3 border-black shadow-brutal flex items-center justify-center text-2xl font-black">
            🎓
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-display font-black text-black">{user?.name}</h1>
              {(user?.isVerifiedStudent || user?.verifiedStudent !== false) && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[#6EE7B7] text-black border-2 border-black text-xs font-mono font-black flex items-center gap-1 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                  <span>Verified Student</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-mono font-bold text-black/80 mt-1">
              {user?.college || 'MNIT Jaipur'} • {user?.branch || 'Engineering'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-black font-display font-black text-xs border-2 border-black shadow-brutal-sm flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-slate-200 text-black font-display font-black text-xs border-2 border-black shadow-brutal-sm transition cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-[#FF6B97] hover:bg-[#FF2A85] text-white font-display font-black text-xs border-2 border-black shadow-brutal-sm flex items-center space-x-1.5 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-[#6EE7B7] text-black border-2.5 border-black font-bold text-xs shadow-brutal flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-[#FF6B97] text-white border-2.5 border-black font-bold text-xs shadow-brutal">
          {error}
        </div>
      )}


      {/* Profile Details Card */}
      <div className="bg-white dark:bg-[#121522] border-3 border-black rounded-3xl p-6 sm:p-8 shadow-brutal-xl text-black dark:text-white space-y-6">
        <h2 className="text-lg font-display font-black border-b-2 border-black pb-3">Student Information</h2>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 text-xs font-bold">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-black/70 dark:text-white/70">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-black/70 dark:text-white/70">College / Campus</label>
                <input
                  type="text"
                  required
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-black/70 dark:text-white/70">Branch / Department</label>
                <input
                  type="text"
                  required
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-black/70 dark:text-white/70">Academic Year</label>
                <input
                  type="text"
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="e.g. 3rd Year / 4th Year"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-black/70 dark:text-white/70">Hostel / Campus Residence</label>
                <input
                  type="text"
                  required
                  value={formData.hostel}
                  onChange={(e) => setFormData({ ...formData, hostel: e.target.value })}
                  placeholder="e.g. Hostel 5 / Day Scholar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-black/70 dark:text-white/70">Phone (for Pickup Hand-offs)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#6EE7B7] hover:bg-[#34D399] text-black font-display font-black text-xs border-2 border-black shadow-brutal flex items-center space-x-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#F9FAFB] dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm space-y-1">
              <div className="text-[10px] font-mono font-black uppercase text-black/60 dark:text-white/60 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>College Email</span>
              </div>
              <div className="text-sm font-mono font-black">{user?.email}</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F9FAFB] dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm space-y-1">
              <div className="text-[10px] font-mono font-black uppercase text-black/60 dark:text-white/60 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                <span>College / Institution</span>
              </div>
              <div className="text-sm font-display font-black">{user?.college || 'MNIT Jaipur'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F9FAFB] dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm space-y-1">
              <div className="text-[10px] font-mono font-black uppercase text-black/60 dark:text-white/60 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Branch / Department</span>
              </div>
              <div className="text-sm font-display font-black">{user?.branch || 'Computer Science & Engineering'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F9FAFB] dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm space-y-1">
              <div className="text-[10px] font-mono font-black uppercase text-black/60 dark:text-white/60 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Academic Year</span>
              </div>
              <div className="text-sm font-mono font-black">{user?.year || '3rd Year'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F9FAFB] dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm space-y-1">
              <div className="text-[10px] font-mono font-black uppercase text-black/60 dark:text-white/60 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5" />
                <span>Hostel / Pickup Spot</span>
              </div>
              <div className="text-sm font-mono font-black">{user?.hostel || 'Hostel 5'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F9FAFB] dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm space-y-1">
              <div className="text-[10px] font-mono font-black uppercase text-black/60 dark:text-white/60 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>Contact Phone</span>
              </div>
              <div className="text-sm font-mono font-black">{user?.phone || 'Not provided'}</div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="pt-4 border-t-2 border-black flex flex-wrap gap-3">
          {onNavigateToMarketplace && (
            <button
              onClick={onNavigateToMarketplace}
              className="px-4 py-2 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-black font-display font-bold text-xs border-2 border-black shadow-brutal-sm transition cursor-pointer"
            >
              Browse Marketplace
            </button>
          )}
          {onNavigateToListings && (
            <button
              onClick={onNavigateToListings}
              className="px-4 py-2 rounded-xl bg-[#6EE7B7] hover:bg-[#34D399] text-black font-display font-bold text-xs border-2 border-black shadow-brutal-sm transition cursor-pointer"
            >
              My Listings & Requests
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
