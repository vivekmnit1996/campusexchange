import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthPage } from './components/AuthPage';
import { Navbar } from './components/Navbar';
import { StorefrontView } from './components/StorefrontView';
import { WishlistView } from './components/WishlistView';
import { VendorStoreView } from './components/VendorStoreView';
import { VendorPortalView } from './components/VendorPortalView';
import { AdminHubView } from './components/AdminHubView';
import { ConcurrencyLabView } from './components/ConcurrencyLabView';
import { CartDrawer } from './components/CartDrawer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ApiDocsModal } from './components/ApiDocsModal';
import { OrdersHistoryView } from './components/OrdersHistoryView';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { Sparkles, Bot } from 'lucide-react';

const LoadingScreen = () => (
  <div className="min-h-screen bg-[#5B85FA] dark:bg-[#090A10] brutal-grid-bg flex items-center justify-center p-4">
    <div className="neo-card p-8 text-center space-y-4 shadow-brutal-xl animate-pop-in">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FEF08A] dark:bg-[#FFE600] border-3 border-black shadow-brutal">
        <Sparkles className="w-7 h-7 text-black animate-spin" />
      </div>
      <h2 className="text-lg font-display font-black text-black dark:text-white">Loading MarketPulse...</h2>
      <p className="text-xs font-mono font-bold text-black/70 dark:text-white/70">Neo-Brutalist Engine</p>
    </div>
  </div>
);

const MainApp = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState(() => {
    const savedUser = localStorage.getItem('mp_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.role === 'vendor') return 'vendor';
        if (parsed.role === 'admin') return 'admin';
      } catch (e) {}
    }
    return 'store';
  });

  const [selectedStoreSlug, setSelectedStoreSlug] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isApiDocsOpen, setIsApiDocsOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  React.useEffect(() => {
    if (user?.role === 'vendor' && currentTab !== 'vendor' && currentTab !== 'store-detail' && currentTab !== 'store') {
      setCurrentTab('vendor');
    } else if (user?.role === 'admin' && currentTab !== 'admin' && currentTab !== 'vendor' && currentTab !== 'concurrency' && currentTab !== 'store' && currentTab !== 'store-detail') {
      setCurrentTab('admin');
    }
  }, [user]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleOpenStore = (slug) => {
    setSelectedStoreSlug(slug);
    setCurrentTab('store-detail');
  };

  return (
    <div className="min-h-screen bg-[#5B85FA] dark:bg-[#090A10] brutal-grid-bg text-black dark:text-white selection:bg-[#FEF08A] selection:text-black flex flex-col justify-between transition-colors duration-200 relative">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenApiDocs={() => setIsApiDocsOpen(true)}
        onOpenAi={() => setIsAiOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {currentTab === 'store' && (
          <StorefrontView
            onSelectProduct={(product) => setSelectedProduct(product)}
            onOpenStore={handleOpenStore}
          />
        )}
        {currentTab === 'wishlist' && (
          <WishlistView
            onGoToStore={() => setCurrentTab('store')}
            onSelectProduct={(product) => setSelectedProduct(product)}
          />
        )}
        {currentTab === 'store-detail' && (
          <VendorStoreView
            storeSlug={selectedStoreSlug}
            onBack={() => setCurrentTab('store')}
            onSelectProduct={(product) => setSelectedProduct(product)}
          />
        )}
        {currentTab === 'orders' && <OrdersHistoryView onGoToStore={() => setCurrentTab('store')} />}
        {currentTab === 'vendor' && <VendorPortalView />}
        {currentTab === 'admin' && <AdminHubView />}
        {currentTab === 'concurrency' && <ConcurrencyLabView />}
      </main>

      {/* Persistent Floating AI Assistant Launcher FAB */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsAiOpen(true)}
          className="group relative flex items-center space-x-2 bg-[#FFE600] hover:bg-[#FFD700] text-black px-4 py-3.5 rounded-2xl border-3 border-black shadow-brutal hover:shadow-brutal-lg hover:-translate-y-1 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200 font-display font-black text-sm uppercase tracking-wider cursor-pointer"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-black"></span>
          </span>
          <Sparkles className="w-5 h-5 text-black group-hover:rotate-12 transition-transform" />
          <span>Ask AI Pulse</span>
        </button>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderCompleted={(order) => {}}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onOpenStore={handleOpenStore}
      />

      {/* API Specs Modal */}
      <ApiDocsModal
        isOpen={isApiDocsOpen}
        onClose={() => setIsApiDocsOpen(false)}
      />

      {/* AI Assistant Drawer (LangGraph Agent) */}
      <AiAssistantDrawer
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onSelectProduct={(product) => setSelectedProduct(product)}
        onOpenStore={handleOpenStore}
      />

      {/* Footer */}
      <footer className="border-t-3 border-black bg-[#FEF08A] dark:bg-[#121522] py-6 px-4 sm:px-6 lg:px-8 text-xs text-black dark:text-white font-mono font-bold shadow-[0px_-4px_0px_0px_#000] transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-display font-black text-sm uppercase bg-black text-white px-2 py-0.5 rounded-md border border-white/20">MarketPulse</span>
            <span>★</span>
            <span>Neo-Brutalist & Cyber-Dark Engine</span>
          </div>

          <div className="flex items-center space-x-4 text-xs font-black">
            <span className="hover:underline cursor-pointer">Privacy</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Terms</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Vendors</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <MainApp />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
