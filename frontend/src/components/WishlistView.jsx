import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import {
  Heart,
  ShoppingBag,
  Trash2,
  Plus,
  Star,
  Store,
  ArrowRight,
} from 'lucide-react';

export const WishlistView = ({ onGoToStore, onSelectProduct }) => {
  const { wishlistProducts, toggleWishlist, loading } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = (product) => {
    addToCart(product, 1);
    toggleWishlist(product);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pop-in">
      {/* Header */}
      <div className="bg-[#FF6B97] border-3 border-black rounded-3xl p-6 sm:p-8 shadow-brutal-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div>
          <div className="inline-flex items-center space-x-2 bg-black text-white px-3 py-1 rounded-full text-xs font-mono font-bold">
            <Heart className="w-3.5 h-3.5 fill-current text-[#FF6B97]" />
            <span>SAVED FAVORITES ({wishlistProducts.length})</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white mt-2">
            My Wishlist
          </h1>
          <p className="text-xs sm:text-sm font-bold text-white/90 mt-1">
            Products saved for later across multiple verified creator stores
          </p>
        </div>

        <button
          onClick={onGoToStore}
          className="px-4 py-2.5 rounded-xl bg-white border-2 border-black text-black font-display font-black text-xs shadow-brutal flex items-center space-x-1.5 self-start sm:self-auto hover:bg-[#FEF08A] transition"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border-3 border-black rounded-2xl p-5 h-64 animate-pulse shadow-brutal" />
          ))}
        </div>
      ) : wishlistProducts.length === 0 ? (
        <div className="text-center py-16 bg-white border-3 border-black rounded-3xl p-8 shadow-brutal space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FF6B97] border-2.5 border-black shadow-brutal flex items-center justify-center mx-auto text-white">
            <Heart className="w-7 h-7 fill-current" />
          </div>
          <h3 className="text-base font-display font-black text-black">Your wishlist is empty</h3>
          <p className="text-xs font-bold text-black/70 max-w-sm mx-auto">
            Click the heart icon on any product in the catalog to save it for later.
          </p>
          <button
            onClick={onGoToStore}
            className="neo-btn-primary text-xs inline-flex items-center space-x-1.5 mt-2"
          >
            <span>Explore Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistProducts.map((product) => (
            <div
              key={product._id}
              onClick={() => onSelectProduct(product)}
              className="bg-white dark:bg-[#161A2B] border-3 border-black rounded-3xl shadow-brutal dark:shadow-[5px_5px_0px_0px_#000000,0_0_0_1.5px_rgba(255,255,255,0.18)] hover:shadow-brutal-lg dark:hover:shadow-[7px_7px_0px_0px_#000000,0_0_20px_rgba(0,240,255,0.35)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition duration-150 cursor-pointer flex flex-col justify-between overflow-hidden group text-black dark:text-white"
            >
              <div className="relative h-48 w-full bg-[#F3F4F6] dark:bg-[#20253B] overflow-hidden border-b-3 border-black">
                <img
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product);
                  }}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-[#FF6B97] dark:bg-[#FF2A85] text-white border-2 border-black shadow-brutal-sm hover:scale-110 transition"
                  title="Remove from wishlist"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-black mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-[#C4B5FD] dark:bg-[#B026FF] dark:text-white border border-black uppercase tracking-wider font-black">{product.category}</span>
                    <div className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#FEF08A] dark:bg-[#FFE600] text-black border border-black font-black">
                      <Star className="w-3 h-3 text-black fill-current" />
                      <span>{product.rating}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-display font-black text-black dark:text-white line-clamp-1 mt-2">
                    {product.title}
                  </h3>
                  <p className="text-xs font-semibold text-black/70 dark:text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="pt-3 border-t-2 border-black flex items-center justify-between">
                  <div>
                    <span className="text-base font-black text-black dark:text-[#FFE600] font-mono">${product.price?.toFixed(2)}</span>
                    <div className="text-[10px] font-mono font-bold text-black/70 dark:text-slate-300">
                      Stock: <span className={product.stock > 0 ? 'text-black dark:text-[#00FF87] font-black' : 'text-rose-600 font-black'}>{product.stock} units</span>
                    </div>
                  </div>

                  <button
                    disabled={product.stock === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveToCart(product);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#6EE7B7] dark:bg-[#00FF87] hover:bg-[#34D399] text-black font-display font-black text-xs border-2 border-black shadow-brutal-sm flex items-center space-x-1.5 transition"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Move to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
