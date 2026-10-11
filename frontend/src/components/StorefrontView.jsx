import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Star,
  MapPin,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Filter,
} from 'lucide-react';

const CAMPUS_CATEGORIES = [
  'All',
  'Calculators',
  'Books',
  'Electronics',
  'Furniture',
  'Sports equipment',
  'Notes/study material',
  'Other useful student items',
];

export const StorefrontView = ({ onSelectProduct, onOpenCreateListing }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [selectedQuickTab, setSelectedQuickTab] = useState('all'); // 'all' | 'recent' | 'graduating' | 'affordable'
  const [maxPrice, setMaxPrice] = useState(6000);
  const [pickupLocationFilter, setPickupLocationFilter] = useState('');

  const marketplaceRef = useRef(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedCondition !== 'All') params.condition = selectedCondition;
      if (pickupLocationFilter) params.pickupLocation = pickupLocationFilter;

      if (selectedQuickTab === 'graduating') {
        params.reasonForSelling = 'Graduating';
      } else if (selectedQuickTab === 'affordable') {
        params.maxPrice = 1000;
      } else if (maxPrice < 6000) {
        params.maxPrice = maxPrice;
      }

      if (selectedQuickTab === 'recent') {
        params.sortBy = 'createdAt';
        params.order = 'desc';
      }

      const data = await api.getProducts(params);
      if (data?.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Fetch products failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedCondition, selectedQuickTab, maxPrice, pickupLocationFilter]);

  const scrollToMarketplace = () => {
    marketplaceRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pop-in">
      {/* 11. Simple Homepage Hero */}
      <div className="bg-[#FEF08A] dark:bg-[#FFE600] border-3 border-black rounded-3xl p-6 sm:p-10 shadow-brutal-xl text-black relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-black text-white px-3 py-1 rounded-full text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#FFE600]" />
            <span>CAMPUS P2P STUDENT MARKETPLACE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-black text-black tracking-tight leading-tight">
            CampusExchange
          </h1>

          <div className="text-lg sm:text-2xl font-display font-black text-black">
            "Buy. Sell. Reuse. Within Your Campus."
          </div>

          <p className="text-xs sm:text-sm font-bold text-black/85 max-w-xl leading-relaxed">
            Buy and sell books, calculators, bicycles, electronics, hostel items and more from students in your college.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={scrollToMarketplace}
              className="px-5 py-3 rounded-2xl bg-black hover:bg-black/90 text-white font-display font-black text-xs border-2 border-black shadow-brutal flex items-center space-x-2 transition cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px]"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onOpenCreateListing && (
              <button
                onClick={onOpenCreateListing}
                className="px-5 py-3 rounded-2xl bg-[#FF6B97] hover:bg-[#FF2A85] text-white font-display font-black text-xs border-2 border-black shadow-brutal flex items-center space-x-2 transition cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Sell an Item</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Showcase Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        {[
          { id: 'all', label: 'All Items' },
          { id: 'recent', label: 'Recently Listed' },
          { id: 'graduating', label: '🎓 Campus Clearance' },
          { id: 'affordable', label: '🏷️ Affordable Deals (Under ₹1,000)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedQuickTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-display font-black border-2 border-black transition cursor-pointer ${
              selectedQuickTab === tab.id
                ? 'bg-[#6EE7B7] dark:bg-[#00FF87] text-black shadow-brutal'
                : 'bg-white dark:bg-[#1A1E30] text-black dark:text-white shadow-brutal-sm hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 12. Simple Marketplace Section */}
      <div ref={marketplaceRef} className="space-y-6">
        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-[#121522] border-3 border-black rounded-3xl p-5 sm:p-6 shadow-brutal-xl space-y-4 text-black dark:text-white">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/60 dark:text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search calculators, bicycles, textbooks, tables, electronics..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1A1E30] border-2 border-black text-xs font-bold text-black dark:text-white shadow-xs focus:bg-white dark:focus:bg-[#252A42]"
              />
            </div>

            {/* Condition Filter */}
            <div className="flex items-center space-x-2">
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black text-xs font-bold text-black dark:text-white shadow-xs cursor-pointer"
              >
                <option value="All">All Conditions</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="New">Brand New</option>
              </select>

              {/* Price Filter */}
              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-[#1A1E30] px-3 py-2 rounded-xl border-2 border-black text-xs font-mono font-bold">
                <span>Max: ₹{maxPrice.toLocaleString()}</span>
                <input
                  type="range"
                  min="200"
                  max="6000"
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-20 accent-black dark:accent-[#FFE600] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Categories Row */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            {CAMPUS_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-display font-bold border-2 border-black transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#FEF08A] dark:bg-[#FFE600] text-black shadow-brutal-xs font-black'
                    : 'bg-white dark:bg-[#1A1E30] text-black dark:text-white hover:bg-slate-100 dark:hover:bg-[#252A42]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#121522] border-3 border-black rounded-3xl p-5 h-72 animate-pulse shadow-brutal"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#121522] border-3 border-black rounded-3xl p-8 shadow-brutal space-y-3 text-black dark:text-white">
            <AlertCircle className="w-10 h-10 text-black dark:text-[#FFE600] mx-auto" />
            <h3 className="text-base font-display font-black">No Campus Listings Found</h3>
            <p className="text-xs font-bold text-black/70 dark:text-slate-300 max-w-sm mx-auto">
              Try adjusting your search query, condition, or category filter to discover pre-loved items from fellow campus students.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const seller = product.seller;
              const availableStock = product.quantity !== undefined ? product.quantity : (product.stock ?? 1);
              const isAvailable = product.status === 'AVAILABLE' && availableStock > 0;

              return (
                <div
                  key={product._id}
                  onClick={() => onSelectProduct && onSelectProduct(product)}
                  className="bg-white dark:bg-[#161A2B] border-3 border-black rounded-3xl shadow-brutal hover:shadow-brutal-lg hover:translate-x-[-2px] hover:translate-y-[-2px] transition duration-150 cursor-pointer flex flex-col justify-between overflow-hidden group text-black dark:text-white"
                >
                  {/* Image & Status Badge */}
                  <div className="relative h-52 w-full bg-[#F3F4F6] dark:bg-[#20253B] overflow-hidden border-b-3 border-black">
                    <img
                      src={
                        product.images?.[0] ||
                        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />

                    {/* Condition & Stock badge */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                      <span className="px-2.5 py-0.5 rounded-lg bg-white/95 dark:bg-[#1A1E30]/95 text-black dark:text-white border border-black text-[10px] font-mono font-black shadow-xs">
                        ✓ {product.condition || 'Good'}
                      </span>
                      {isAvailable && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border border-black text-[9px] font-mono font-black shadow-xs">
                          📦 {availableStock} {availableStock === 1 ? 'unit' : 'units'} left
                        </span>
                      )}
                      {product.reasonForSelling && product.reasonForSelling !== 'Other' && (
                        <span className="px-2 py-0.5 rounded-lg bg-[#FF6B97] text-white border border-black text-[9px] font-mono font-black shadow-xs">
                          {product.reasonForSelling === 'Graduating' ? '🎓 Graduating' : product.reasonForSelling}
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg border-2 border-black text-[10px] font-mono font-black shadow-xs ${
                          isAvailable
                            ? 'bg-[#6EE7B7] text-black'
                            : product.status === 'RESERVED'
                            ? 'bg-[#FEF08A] text-black'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {isAvailable ? 'AVAILABLE' : product.status}
                      </span>
                    </div>

                    {/* Pickup Location overlay */}
                    {product.pickupLocation && (
                      <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-lg bg-black/85 text-white text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm max-w-[85%] truncate">
                        <MapPin className="w-3 h-3 text-[#FFE600]" />
                        <span className="truncate">{product.pickupLocation}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold text-black mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-[#C4B5FD] text-black border border-black uppercase tracking-wider font-black text-[10px]">
                          {product.category}
                        </span>
                        {product.rating > 0 && (
                          <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-[#FEF08A] text-black border border-black font-black text-[10px]">
                            <Star className="w-3 h-3 fill-current text-black" />
                            <span>{product.rating}</span>
                          </div>
                        )}
                      </div>

                      <h3 className="text-base font-display font-black text-black dark:text-white line-clamp-1 mt-1.5">
                        {product.title}
                      </h3>

                      <p className="text-xs font-semibold text-black/70 dark:text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Seller Information */}
                      <div className="mt-2.5 text-[11px] font-mono text-black/70 dark:text-white/70 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-black dark:text-white">
                            Seller: {seller?.name || 'Verified Student'}
                          </span>
                          <span className="px-1 py-0.2 rounded bg-[#6EE7B7] text-black border border-black text-[8px] font-mono font-black uppercase">
                            ✓ Verified
                          </span>
                        </div>
                        <div className="text-[10px] text-black/60 dark:text-slate-400 truncate">
                          {seller?.year || product.year || 'Student'} • {seller?.branch || product.branch || 'CSE'}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Price & View Details Action */}
                    <div className="pt-3 border-t-2 border-black flex items-center justify-between">
                      <div>
                        <div className="text-lg font-black font-mono text-black dark:text-[#FFE600]">
                          ₹{product.price?.toLocaleString()}
                        </div>
                        {product.compareAtPrice && (
                          <div className="text-[10px] text-black/50 dark:text-slate-400 line-through font-mono -mt-1">
                            ₹{product.compareAtPrice?.toLocaleString()}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectProduct) onSelectProduct(product);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl border-2 border-black font-display font-black text-xs shadow-brutal-sm transition cursor-pointer ${
                          isAvailable
                            ? 'bg-[#FEF08A] hover:bg-[#FFE600] text-black'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isAvailable ? 'View Details' : product.status}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
