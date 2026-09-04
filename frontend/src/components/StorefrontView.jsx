import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Star,
  Shield,
  Heart,
  Store,
  ArrowUpDown,
  Sparkles,
  Zap,
} from 'lucide-react';

export const StorefrontView = ({ onSelectProduct, onOpenStore }) => {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(500);
  const [sortBy, setSortBy] = useState('createdAt');
  const [addedToast, setAddedToast] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (inStockOnly) params.inStock = 'true';
      if (maxPrice < 500) params.maxPrice = maxPrice;
      if (sortBy) params.sortBy = sortBy;

      const data = await api.getProducts(params);
      if (data.success) {
        setProducts(data.products || []);
        if (data.categories) setCategories(['All', ...data.categories]);
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
  }, [search, selectedCategory, inStockOnly, maxPrice, sortBy]);

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedToast(product.title);
    setTimeout(() => setAddedToast(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pop-in">
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FEF08A] dark:bg-[#FFE600] text-black font-display font-bold px-5 py-3 rounded-2xl shadow-brutal-xl flex items-center space-x-2.5 border-3 border-black animate-pop-in">
          <CheckCircle2 className="w-5 h-5 text-black" />
          <span className="text-xs">Added <span className="underline">"{addedToast}"</span> to cart!</span>
        </div>
      )}

      {/* Neubrutalist Hero Card */}
      <div className="bg-[#FEF08A] dark:bg-[#FFE600] border-3 border-black rounded-3xl p-6 sm:p-8 shadow-brutal-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden text-black">
        <div className="space-y-3 z-10">
          <div className="inline-flex items-center space-x-2 bg-black text-white px-3 py-1 rounded-full text-xs font-mono font-bold">
            <Zap className="w-3.5 h-3.5 text-[#FEF08A] fill-current" />
            <span>DIRECT MULTI-VENDOR MARKETPLACE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-black tracking-tight leading-tight">
            DISCOVER INDEPENDENT <br className="hidden sm:block" />
            <span className="bg-[#FF6B97] dark:bg-[#FF2A85] text-white px-2 py-0.5 rounded-lg border-2 border-black shadow-brutal-sm inline-block rotate-[-1deg]">
              CREATOR STUDIOS
            </span>
          </h1>
          <p className="text-xs sm:text-sm font-bold text-black/90 max-w-xl leading-relaxed">
            Shop hardware, studio audio, and artisanal robotics in one single unified checkout. Sub-orders are automatically partitioned and fulfilled directly by verified merchants.
          </p>
        </div>

        <div className="flex flex-col gap-3 self-start md:self-auto z-10">
          <div className="px-4 py-2.5 rounded-2xl bg-white border-2.5 border-black shadow-brutal text-xs font-mono font-bold flex items-center space-x-2 text-black">
            <Shield className="w-4 h-4 text-black" />
            <span>Zero-Oversell Guarantee</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-[#6EE7B7] dark:bg-[#00FF87] border-2.5 border-black shadow-brutal text-xs font-mono font-bold flex items-center space-x-2 text-black">
            <Sparkles className="w-4 h-4 text-black" />
            <span>Instant Free UPI & 0% Fees</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-[#121522] border-3 border-black rounded-3xl p-4 sm:p-5 shadow-brutal-lg space-y-4 transition-colors">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-black dark:text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search catalog, keyboards, gear, materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1E30] border-2 border-black text-xs font-bold text-black dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:bg-[#FEFCE8] dark:focus:bg-[#252A42] focus:outline-none shadow-xs"
            />
          </div>

          {/* Sort & In-Stock */}
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-1.5 bg-[#F9FAFB] dark:bg-[#1A1E30] border-2 border-black rounded-xl px-3 py-2 text-xs font-bold text-black dark:text-white shadow-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-black dark:text-white" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-black dark:text-white text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="createdAt" className="dark:bg-[#1A1E30] dark:text-white">Newest Listings</option>
                <option value="price" className="dark:bg-[#1A1E30] dark:text-white">Price: Low to High</option>
                <option value="rating" className="dark:bg-[#1A1E30] dark:text-white">Highest Rated</option>
              </select>
            </div>

            <label className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#6EE7B7] dark:bg-[#00FF87] border-2 border-black text-xs font-bold text-black cursor-pointer shadow-brutal-sm hover:translate-x-[-1px] transition">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded accent-black w-4 h-4"
              />
              <span>In Stock</span>
            </label>
          </div>
        </div>

        {/* Categories & Price Slider */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t-2 border-black">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat, i) => {
              const isActive = selectedCategory === cat;
              const colors = [
                'bg-[#FEF08A] dark:bg-[#FFE600]',
                'bg-[#FF6B97] dark:bg-[#FF2A85] text-white',
                'bg-[#6EE7B7] dark:bg-[#00FF87]',
                'bg-[#C4B5FD] dark:bg-[#B026FF] text-white',
                'bg-[#67E8F9] dark:bg-[#00F0FF]',
              ];
              const pillColor = colors[i % colors.length];

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-black whitespace-nowrap transition border-2 border-black ${
                    isActive
                      ? `${pillColor} text-black shadow-brutal translate-x-[-1px] translate-y-[-1px]`
                      : 'bg-white dark:bg-[#1A1E30] text-black dark:text-white hover:bg-slate-100 dark:hover:bg-[#252A42] shadow-xs'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Price Range Slider */}
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-black dark:text-white self-end sm:self-auto bg-[#F3F4F6] dark:bg-[#1A1E30] px-3 py-1.5 rounded-xl border-2 border-black shadow-xs">
            <span>Max: ${maxPrice}</span>
            <input
              type="range"
              min="20"
              max="500"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-24 accent-black dark:accent-[#FFE600] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-[#121522] border-3 border-black rounded-3xl p-5 h-72 animate-pulse shadow-brutal" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#121522] border-3 border-black rounded-3xl p-8 shadow-brutal space-y-3 text-black dark:text-white">
          <AlertCircle className="w-10 h-10 text-black dark:text-[#FFE600] mx-auto" />
          <h3 className="text-base font-display font-black">No Products Matched</h3>
          <p className="text-xs font-bold text-black/70 dark:text-slate-300 max-w-sm mx-auto">
            Try adjusting your search query, price limit, or category filter to discover available catalog items.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const inWish = isInWishlist(product._id);

            return (
              <div
                key={product._id}
                onClick={() => onSelectProduct(product)}
                className="bg-white dark:bg-[#161A2B] border-3 border-black rounded-3xl shadow-brutal dark:shadow-[5px_5px_0px_0px_#000000,0_0_0_1.5px_rgba(255,255,255,0.18)] hover:shadow-brutal-lg dark:hover:shadow-[7px_7px_0px_0px_#000000,0_0_20px_rgba(0,240,255,0.35)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition duration-150 cursor-pointer flex flex-col justify-between overflow-hidden group text-black dark:text-white"
              >
                {/* Product Image & Badges */}
                <div className="relative h-52 w-full bg-[#F3F4F6] dark:bg-[#20253B] overflow-hidden border-b-3 border-black">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  {/* Wishlist Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product);
                    }}
                    className={`absolute top-3 right-3 p-2 rounded-xl border-2 border-black transition shadow-brutal-sm ${
                      inWish
                        ? 'bg-[#FF6B97] dark:bg-[#FF2A85] text-white'
                        : 'bg-white dark:bg-[#252A42] text-black dark:text-white hover:bg-[#FF6B97] hover:text-white'
                    }`}
                    title={inWish ? 'Remove from wishlist' : 'Save to wishlist'}
                  >
                    <Heart className={`w-4 h-4 ${inWish ? 'fill-current' : ''}`} />
                  </button>

                  {/* Vendor Store Tag */}
                  {product.store && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenStore && product.store.slug) {
                          onOpenStore(product.store.slug);
                        }
                      }}
                      className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-white dark:bg-[#252A42] border-2 border-black text-[10px] font-display font-black text-black dark:text-white hover:bg-[#FEF08A] dark:hover:bg-[#FFE600] dark:hover:text-black flex items-center space-x-1 transition shadow-brutal-sm"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>{product.store.name}</span>
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-black mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-[#C4B5FD] dark:bg-[#B026FF] dark:text-white border border-black uppercase tracking-wider font-black">{product.category}</span>
                      <div className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#FEF08A] dark:bg-[#FFE600] text-black border border-black font-black">
                        <Star className="w-3 h-3 text-black fill-current" />
                        <span>{product.rating}</span>
                        <span className="text-[10px] opacity-70">({product.numReviews || 0})</span>
                      </div>
                    </div>

                    <h3 className="text-base font-display font-black text-black dark:text-white line-clamp-1 mt-2">
                      {product.title}
                    </h3>
                    <p className="text-xs font-semibold text-black/70 dark:text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Price & Add to Cart */}
                  <div className="pt-3 border-t-2 border-black flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline space-x-1.5 font-mono">
                        <span className="text-lg font-black text-black dark:text-[#FFE600]">${product.price.toFixed(2)}</span>
                        {product.compareAtPrice && (
                          <span className="text-xs text-black/50 dark:text-slate-400 line-through">
                            ${product.compareAtPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono font-bold text-black/70 dark:text-slate-300">
                        Stock: <span className={product.stock > 0 ? 'text-black dark:text-[#00FF87] font-black' : 'text-rose-600 font-black'}>
                          {product.stock > 0 ? `${product.stock} units` : 'Sold Out'}
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Add / Quantity Stepper Button */}
                    {(() => {
                      const cartQty = getItemQuantity(product._id);
                      if (cartQty > 0) {
                        return (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center bg-[#FEF08A] dark:bg-[#FFE600] border-2 border-black rounded-xl shadow-brutal-sm text-black font-black"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(product._id, cartQty - 1);
                              }}
                              className="px-2 py-1.5 hover:bg-[#FDE047] dark:hover:bg-[#FFF500] rounded-l-lg transition cursor-pointer"
                              title="Decrease quantity (-1)"
                            >
                              <Minus className="w-3.5 h-3.5 text-black stroke-[3]" />
                            </button>
                            <span className="px-2 font-mono text-xs font-black text-black select-none">
                              {cartQty}
                            </span>
                            <button
                              type="button"
                              disabled={cartQty >= product.stock}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (cartQty < product.stock) {
                                  addToCart(product, 1);
                                }
                              }}
                              className="px-2 py-1.5 hover:bg-[#FDE047] dark:hover:bg-[#FFF500] disabled:opacity-30 rounded-r-lg transition cursor-pointer"
                              title="Add more (+1)"
                            >
                              <Plus className="w-3.5 h-3.5 text-black stroke-[3]" />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <button
                          disabled={product.stock === 0}
                          onClick={(e) => handleAddToCart(product, e)}
                          className={`px-4 py-2 rounded-xl text-xs font-display font-black border-2 border-black transition ${
                            product.stock > 0
                              ? 'bg-[#FEF08A] dark:bg-[#FFE600] text-black hover:bg-[#FDE047] dark:hover:bg-[#FFF500] shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px]'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border-slate-400'
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </div>
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
