import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import {
  ShoppingBag,
  Plus,
  Layers,
  Sparkles,
  User,
  ShieldCheck,
  ChevronDown,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Package,
} from 'lucide-react';

export const Navbar = ({
  currentTab,
  setCurrentTab,
  onOpenCreateListing,
  onOpenAi,
}) => {
  const { user, logout, setUser, refreshUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#121522] border-b-3 border-black shadow-brutal mb-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand: CampusExchange */}
        <div
          onClick={() => setCurrentTab('marketplace')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FEF08A] dark:bg-[#FFE600] border-2.5 border-black shadow-brutal-sm flex items-center justify-center text-black font-display font-black text-sm group-hover:rotate-6 transition">
            CX
          </div>
          <div>
            <div className="text-lg font-display font-black tracking-tight text-black dark:text-white">
              CampusExchange
            </div>
            <div className="text-[10px] font-mono font-bold text-black/60 dark:text-white/60 -mt-1 hidden sm:block">
              MNIT Jaipur • Student P2P
            </div>
          </div>
        </div>

        {/* Desktop Navigation: Section 10 */}
        <nav className="hidden md:flex items-center space-x-2">
          {/* Marketplace */}
          <button
            onClick={() => setCurrentTab('marketplace')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-bold flex items-center space-x-1.5 transition border-2 border-black cursor-pointer ${
              currentTab === 'marketplace'
                ? 'bg-[#FEF08A] dark:bg-[#FFE600] text-black shadow-brutal translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white dark:bg-[#1A1E30] text-black dark:text-white hover:bg-slate-100 dark:hover:bg-[#252A42] shadow-brutal-sm'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Marketplace</span>
          </button>

          {/* Sell Item Action */}
          <button
            onClick={onOpenCreateListing}
            className="px-3.5 py-1.5 rounded-xl text-xs font-display font-black bg-[#6EE7B7] hover:bg-[#34D399] dark:bg-[#00FF87] text-black border-2 border-black shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Sell Item</span>
          </button>

          {/* My Listings */}
          <button
            onClick={() => setCurrentTab('my-listings')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-bold flex items-center space-x-1.5 transition border-2 border-black cursor-pointer ${
              currentTab === 'my-listings'
                ? 'bg-[#6EE7B7] dark:bg-[#00FF87] text-black shadow-brutal translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white dark:bg-[#1A1E30] text-black dark:text-white hover:bg-slate-100 dark:hover:bg-[#252A42] shadow-brutal-sm'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Listings</span>
          </button>

          {/* My Purchases */}
          <button
            onClick={() => setCurrentTab('my-purchases')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-bold flex items-center space-x-1.5 transition border-2 border-black cursor-pointer ${
              currentTab === 'my-purchases'
                ? 'bg-[#C4B5FD] text-black shadow-brutal translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white dark:bg-[#1A1E30] text-black dark:text-white hover:bg-slate-100 dark:hover:bg-[#252A42] shadow-brutal-sm'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>My Purchases</span>
          </button>

          {/* Campus AI */}
          <button
            onClick={onOpenAi}
            className="px-3 py-1.5 rounded-xl bg-[#A78BFA] hover:bg-[#8B5CF6] dark:bg-[#7C3AED] text-white font-display font-black text-xs border-2 border-black shadow-brutal-sm hover:scale-105 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FEF08A] animate-pulse" />
            <span>Campus AI</span>
          </button>

          {/* Profile */}
          <button
            onClick={() => setCurrentTab('profile')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-bold flex items-center space-x-1.5 transition border-2 border-black cursor-pointer ${
              currentTab === 'profile'
                ? 'bg-[#FF6B97] text-white shadow-brutal translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white dark:bg-[#1A1E30] text-black dark:text-white hover:bg-slate-100 dark:hover:bg-[#252A42] shadow-brutal-sm'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>

          {/* Admin (Only for admin users) */}
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-bold flex items-center space-x-1.5 transition border-2 border-black cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-[#67E8F9] text-black shadow-brutal translate-x-[-1px] translate-y-[-1px]'
                  : 'bg-white dark:bg-[#1A1E30] text-black dark:text-white hover:bg-slate-100 dark:hover:bg-[#252A42] shadow-brutal-sm'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </button>
          )}
        </nav>

        {/* Right Actions: Theme Toggle & User Info */}
        <div className="flex items-center space-x-2.5">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[#FEF08A] dark:bg-[#FFE600] text-black border-2 border-black shadow-brutal-sm hover:scale-105 transition cursor-pointer"
            title={isDark ? 'Switch to Light' : 'Switch to Cyber Dark'}
          >
            {isDark ? <Sun className="w-4 h-4 fill-current" /> : <Moon className="w-4 h-4 fill-current" />}
          </button>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm hover:bg-slate-50 dark:hover:bg-[#252A42] transition text-black dark:text-white cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-[#FEF08A] dark:bg-[#FFE600] border border-black flex items-center justify-center font-black text-[10px] text-black">
                {user?.name ? user.name[0].toUpperCase() : 'S'}
              </div>
              <span className="text-xs font-display font-bold text-black dark:text-white truncate max-w-[90px] hidden sm:block">
                {user?.name}
              </span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#121522] border-3 border-black rounded-2xl shadow-brutal-lg p-2 z-50 animate-pop-in text-black dark:text-white">
                <div className="p-3 bg-[#FEF08A] dark:bg-[#1A1E30] border-2 border-black rounded-xl mb-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-display font-black truncate">{user?.name}</div>
                    <span className="px-1.5 py-0.2 rounded bg-black text-white text-[9px] font-mono font-bold uppercase">
                      {user?.role === 'ADMIN' ? 'Admin' : 'Student'}
                    </span>
                  </div>
                  <div className="text-[10px] opacity-70 font-mono truncate">{user?.email}</div>
                  <div className="mt-1 text-[10px] font-mono font-bold text-black/80 dark:text-slate-300">
                    {user?.college || 'MNIT Jaipur'} • {user?.hostel || 'Hostel 5'}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCurrentTab('profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1A1E30] transition text-xs font-bold"
                >
                  View Profile
                </button>

                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition text-xs font-bold flex items-center space-x-1.5 mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm text-black dark:text-white cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-black bg-white dark:bg-[#121522] px-4 py-3 space-y-2 animate-pop-in">
          <button
            onClick={() => {
              setCurrentTab('marketplace');
              setMobileMenuOpen(false);
            }}
            className="w-full px-3 py-2 rounded-xl text-xs font-bold border-2 border-black text-left flex items-center space-x-2 bg-white dark:bg-[#1A1E30] text-black dark:text-white"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Marketplace</span>
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenCreateListing();
            }}
            className="w-full px-3 py-2 rounded-xl text-xs font-bold border-2 border-black text-left flex items-center space-x-2 bg-[#6EE7B7] text-black font-black"
          >
            <Plus className="w-4 h-4" />
            <span>+ Sell Item</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('my-listings');
              setMobileMenuOpen(false);
            }}
            className="w-full px-3 py-2 rounded-xl text-xs font-bold border-2 border-black text-left flex items-center space-x-2 bg-white dark:bg-[#1A1E30] text-black dark:text-white"
          >
            <Package className="w-4 h-4" />
            <span>My Listings</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('my-purchases');
              setMobileMenuOpen(false);
            }}
            className="w-full px-3 py-2 rounded-xl text-xs font-bold border-2 border-black text-left flex items-center space-x-2 bg-white dark:bg-[#1A1E30] text-black dark:text-white"
          >
            <Layers className="w-4 h-4" />
            <span>My Purchases</span>
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAi();
            }}
            className="w-full px-3 py-2 rounded-xl text-xs font-bold border-2 border-black text-left flex items-center space-x-2 bg-[#A78BFA] text-white font-black"
          >
            <Sparkles className="w-4 h-4" />
            <span>Campus AI</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('profile');
              setMobileMenuOpen(false);
            }}
            className="w-full px-3 py-2 rounded-xl text-xs font-bold border-2 border-black text-left flex items-center space-x-2 bg-white dark:bg-[#1A1E30] text-black dark:text-white"
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => {
                setCurrentTab('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs font-bold border-2 border-black text-left flex items-center space-x-2 bg-[#67E8F9] text-black font-black"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Console</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
