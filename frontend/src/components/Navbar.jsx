import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import {
  ShoppingBag,
  Store,
  BarChart3,
  Zap,
  ChevronDown,
  Layers,
  FileCode,
  LogOut,
  User,
  Heart,
  Menu,
  X,
  Sun,
  Moon,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const Navbar = ({ currentTab, setCurrentTab, onOpenCart, onOpenApiDocs, onOpenAi }) => {
  const { user, logout } = useAuth();
  const { totalItemCount } = useCart();
  const { wishlistCount } = useWishlist();
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

  // Tailored Navigation Items by Role
  const navItems =
    user?.role === 'vendor'
      ? [
          { id: 'vendor', label: 'Vendor Workspace', icon: Store, color: 'bg-[#6EE7B7] dark:bg-[#00FF87] text-black' },
          { id: 'store', label: 'Marketplace Preview', icon: ShoppingBag, color: 'bg-[#FEF08A] dark:bg-[#FFE600] text-black' },
        ]
      : user?.role === 'admin'
      ? [
          { id: 'admin', label: 'Platform Console', icon: BarChart3, color: 'bg-[#FEF08A] dark:bg-[#FFE600] text-black' },
          { id: 'vendor', label: 'Vendor Oversight', icon: Store, color: 'bg-[#6EE7B7] dark:bg-[#00FF87] text-black' },
          { id: 'concurrency', label: 'Concurrency Lab', icon: Zap, color: 'bg-[#FF6B97] dark:bg-[#FF2A85] text-white' },
          { id: 'store', label: 'Live Catalog', icon: ShoppingBag, color: 'bg-[#C4B5FD] dark:bg-[#B026FF] text-black dark:text-white' },
        ]
      : [
          { id: 'store', label: 'Storefront', icon: ShoppingBag, color: 'bg-[#FEF08A] dark:bg-[#FFE600] text-black' },
          { id: 'wishlist', label: 'Wishlist', icon: Heart, count: wishlistCount, color: 'bg-[#FF6B97] dark:bg-[#FF2A85] text-white dark:text-white' },
          { id: 'orders', label: 'My Orders', icon: Layers, color: 'bg-[#C4B5FD] dark:bg-[#B026FF] text-black dark:text-white' },
        ];

  const handleBrandClick = () => {
    if (user?.role === 'vendor') setCurrentTab('vendor');
    else if (user?.role === 'admin') setCurrentTab('admin');
    else setCurrentTab('store');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF] dark:bg-[#121522] border-b-3 border-black shadow-brutal mb-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={handleBrandClick}
        >
          <div className="w-10 h-10 rounded-xl bg-[#FEF08A] dark:bg-[#FFE600] border-2.5 border-black shadow-brutal-sm flex items-center justify-center text-black font-display font-black text-sm group-hover:rotate-6 transition">
            MP
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-display font-black tracking-tight text-black dark:text-white">
              MarketPulse
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#6EE7B7] dark:bg-[#00FF87] border-2 border-black text-[10px] font-mono font-black uppercase text-black shadow-[1px_1px_0px_0px_#000] hidden sm:inline-flex">
              {user?.role === 'vendor' ? 'Vendor Hub' : user?.role === 'admin' ? 'Admin Console' : isDark ? 'Cyber Dark' : 'Neubrutal'}
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-bold flex items-center space-x-1.5 transition border-2 border-black ${
                  isActive
                    ? `${item.color} shadow-brutal translate-x-[-1px] translate-y-[-1px]`
                    : 'bg-white dark:bg-[#1A1E30] text-black dark:text-white hover:bg-slate-100 dark:hover:bg-[#252A42] shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-black text-white text-[10px] font-mono font-black">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-2.5">
          {/* AI Assistant Launcher */}
          <button
            onClick={onOpenAi}
            className="px-3 py-1.5 rounded-xl bg-[#A78BFA] hover:bg-[#8B5CF6] dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white font-display font-black text-xs border-2 border-black shadow-brutal-sm hover:scale-105 active:translate-x-[2px] transition flex items-center space-x-1.5 cursor-pointer"
            title="Ask MarketPulse AI Assistant (LangGraph + Groq)"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FEF08A] animate-pulse" />
            <span className="hidden sm:inline">AI Pulse</span>
          </button>

          {/* Dark / Light Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-xl bg-[#FEF08A] dark:bg-[#FFE600] text-black font-display font-black text-xs border-2 border-black shadow-brutal-sm hover:scale-105 active:translate-x-[2px] transition flex items-center space-x-1.5 cursor-pointer"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Cyber Dark Theme'}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-black fill-current" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-black fill-current" />
                <span className="hidden sm:inline">Cyber Dark</span>
              </>
            )}
          </button>

          {/* Wishlist button (Customers Only) */}
          {user?.role === 'customer' && (
            <button
              onClick={() => setCurrentTab('wishlist')}
              className={`relative p-2 rounded-xl border-2 border-black transition ${
                currentTab === 'wishlist'
                  ? 'bg-[#FF6B97] dark:bg-[#FF2A85] text-white shadow-brutal'
                  : 'bg-white dark:bg-[#1A1E30] text-black dark:text-white shadow-brutal-sm hover:bg-[#FBCFE8] dark:hover:bg-[#FF2A85]/20'
              }`}
              title="My Wishlist"
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black dark:bg-[#FF2A85] text-white text-[10px] font-mono font-black flex items-center justify-center border border-white">
                  {wishlistCount}
                </span>
              )}
            </button>
          )}

          {/* Cart (Customers Only) */}
          {user?.role === 'customer' && (
            <button
              onClick={onOpenCart}
              className="relative p-2 rounded-xl bg-[#FEF08A] dark:bg-[#FFE600] border-2 border-black shadow-brutal-sm hover:bg-[#FDE047] text-black transition"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4 text-black" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black text-white text-[10px] font-mono font-black flex items-center justify-center border border-white">
                  {totalItemCount}
                </span>
              )}
            </button>
          )}

          {/* API Docs & Postman (Admin Only) */}
          {user?.role === 'admin' && (
            <button
              onClick={onOpenApiDocs}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-display font-bold bg-[#67E8F9] dark:bg-[#00F0FF] border-2 border-black shadow-brutal-sm text-black hover:bg-[#38BDF8] transition"
            >
              <FileCode className="w-4 h-4 text-black" />
              <span className="hidden sm:inline">REST Docs</span>
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm text-black dark:text-white"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm hover:bg-slate-50 dark:hover:bg-[#252A42] transition text-black dark:text-white"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full object-cover border border-black" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#FEF08A] dark:bg-[#FFE600] border border-black flex items-center justify-center">
                  <User className="w-3 h-3 text-black" />
                </div>
              )}
              <span className="text-xs font-display font-bold text-black dark:text-white truncate max-w-[90px] hidden sm:block">
                {user?.name}
              </span>
              <ChevronDown className="w-3 h-3 text-black dark:text-white" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#121522] border-3 border-black rounded-2xl shadow-brutal-lg p-2 z-50 animate-pop-in">
                {/* User info */}
                <div className="p-3 bg-[#FEF08A] dark:bg-[#1A1E30] border-2 border-black rounded-xl mb-2 text-black dark:text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-display font-black">{user?.name}</div>
                      <div className="text-[10px] opacity-70 font-mono font-bold truncate">{user?.email}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-black text-white text-[10px] font-mono font-black uppercase">
                      {user?.role}
                    </span>
                  </div>
                  {user?.store && (
                    <div className="mt-1.5 text-[10px] font-bold flex items-center gap-1.5 text-black dark:text-white">
                      <Store className="w-3 h-3" />
                      <span>{user.store.name}</span>
                    </div>
                  )}
                </div>

                {/* Role Specific Quick Links */}
                {user?.role === 'customer' && (
                  <button
                    onClick={() => {
                      setCurrentTab('wishlist');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F3F4F6] dark:hover:bg-[#1A1E30] transition flex items-center space-x-2 text-xs font-bold text-black dark:text-white"
                  >
                    <Heart className="w-4 h-4 text-[#FF6B97] dark:text-[#FF2A85]" />
                    <span>My Wishlist ({wishlistCount})</span>
                  </button>
                )}

                {user?.role === 'vendor' && (
                  <button
                    onClick={() => {
                      setCurrentTab('vendor');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F3F4F6] dark:hover:bg-[#1A1E30] transition flex items-center space-x-2 text-xs font-bold text-black dark:text-white"
                  >
                    <Store className="w-4 h-4 text-[#6EE7B7] dark:text-[#00FF87]" />
                    <span>Vendor Workspace</span>
                  </button>
                )}

                {user?.role === 'admin' && (
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setCurrentTab('admin');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F3F4F6] dark:hover:bg-[#1A1E30] transition flex items-center space-x-2 text-xs font-bold text-black dark:text-white"
                    >
                      <BarChart3 className="w-4 h-4 text-[#FEF08A] dark:text-[#FFE600]" />
                      <span>Platform Analytics Hub</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentTab('concurrency');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F3F4F6] dark:hover:bg-[#1A1E30] transition flex items-center space-x-2 text-xs font-bold text-black dark:text-white"
                    >
                      <Zap className="w-4 h-4 text-[#FF6B97] dark:text-[#FF2A85]" />
                      <span>Concurrency & Webhook Lab</span>
                    </button>
                  </div>
                )}

                {/* Logout */}
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl bg-[#FF6B97]/20 dark:bg-[#FF2A85]/20 hover:bg-[#FF6B97] dark:hover:bg-[#FF2A85] hover:text-white border-2 border-black transition flex items-center space-x-2 text-xs font-bold text-black dark:text-white mt-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-black bg-white dark:bg-[#121522] px-4 py-3 space-y-2 animate-pop-in">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setCurrentTab(item.id); setMobileMenuOpen(false); }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-display font-bold flex items-center justify-between border-2 border-black ${
                  isActive ? `${item.color} shadow-brutal-sm` : 'bg-white dark:bg-[#1A1E30] text-black dark:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.count > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-mono font-bold">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
