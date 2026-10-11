import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthPage } from './components/AuthPage';
import { Navbar } from './components/Navbar';
import { StorefrontView } from './components/StorefrontView';
import { MyListingsView } from './components/MyListingsView';
import { MyPurchasesView } from './components/MyPurchasesView';
import { ProfileView } from './components/ProfileView';
import { AdminHubView } from './components/AdminHubView';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CreateProductModal } from './components/CreateProductModal';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { Sparkles } from 'lucide-react';

const LoadingScreen = () => (
  <div className="min-h-screen bg-[#5B85FA] dark:bg-[#090A10] brutal-grid-bg flex items-center justify-center p-4">
    <div className="neo-card p-8 text-center space-y-4 shadow-brutal-xl animate-pop-in">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FEF08A] dark:bg-[#FFE600] border-3 border-black shadow-brutal">
        <Sparkles className="w-7 h-7 text-black animate-spin" />
      </div>
      <h2 className="text-lg font-display font-black text-black dark:text-white">Loading CampusExchange...</h2>
      <p className="text-xs font-mono font-bold text-black/70 dark:text-white/70">College Peer-to-Peer Marketplace</p>
    </div>
  </div>
);

const MainApp = () => {
  const { user, loading } = useAuth();
  // Default to 'marketplace'
  const [currentTab, setCurrentTab] = useState('marketplace');

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isCreateListingOpen, setIsCreateListingOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-[#5B85FA] dark:bg-[#090A10] brutal-grid-bg text-black dark:text-white selection:bg-[#FEF08A] selection:text-black flex flex-col justify-between transition-colors duration-200 relative">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenCreateListing={() => setIsCreateListingOpen(true)}
        onOpenAi={() => setIsAiOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {(currentTab === 'marketplace' || currentTab === 'store') && (
          <StorefrontView
            onSelectProduct={(product) => setSelectedProduct(product)}
            onOpenCreateListing={() => setIsCreateListingOpen(true)}
          />
        )}
        {currentTab === 'my-listings' && (
          <MyListingsView
            onSelectProduct={(product) => setSelectedProduct(product)}
            onOpenCreateListing={() => setIsCreateListingOpen(true)}
          />
        )}
        {(currentTab === 'my-purchases' || currentTab === 'orders') && (
          <MyPurchasesView
            onGoToMarketplace={() => setCurrentTab('marketplace')}
          />
        )}
        {currentTab === 'profile' && (
          <ProfileView
            onNavigateToMarketplace={() => setCurrentTab('marketplace')}
            onNavigateToListings={() => setCurrentTab('my-listings')}
          />
        )}
        {currentTab === 'admin' && <AdminHubView />}
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
          <span>Ask Campus AI</span>
        </button>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onReservationSuccess={() => {
          setSelectedProduct(null);
          setCurrentTab('my-purchases');
        }}
      />

      {/* Create Campus Listing Modal */}
      <CreateProductModal
        isOpen={isCreateListingOpen}
        onClose={() => setIsCreateListingOpen(false)}
        onProductCreated={(newProduct) => {
          setSelectedProduct(null);
          setCurrentTab('my-listings');
        }}
      />

      {/* AI Assistant Drawer (LangGraph Agent) */}
      <AiAssistantDrawer
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onSelectProduct={(product) => {
          setIsAiOpen(false);
          setSelectedProduct(product);
        }}
      />

      {/* Footer */}
      <footer className="border-t-3 border-black bg-[#FEF08A] dark:bg-[#121522] py-6 px-4 sm:px-6 lg:px-8 text-xs text-black dark:text-white font-mono font-bold shadow-[0px_-4px_0px_0px_#000] transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-display font-black text-sm uppercase bg-black text-white px-2 py-0.5 rounded-md border border-white/20">
              CampusExchange
            </span>
            <span>★</span>
            <span>Buy. Sell. Reuse. Within Your Campus.</span>
          </div>

          <div className="flex items-center space-x-4 text-xs font-black">
            <span>MNIT Jaipur</span>
            <span>•</span>
            <span>Direct Campus Pickups</span>
            <span>•</span>
            <span>0% Platform Commission</span>
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
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
