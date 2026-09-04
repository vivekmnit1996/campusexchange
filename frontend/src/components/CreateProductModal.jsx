import React, { useState } from 'react';
import { api } from '../services/api';
import { X, Plus, Package, AlertCircle } from 'lucide-react';

export const CreateProductModal = ({ isOpen, onClose, onProductCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Electronics',
    price: '',
    compareAtPrice: '',
    stock: '',
    description: '',
    tags: '',
    images: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.createProduct({
        ...formData,
        price: Number(formData.price),
        compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : undefined,
        stock: Number(formData.stock),
        images: [formData.images],
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      });

      if (res.success) {
        onProductCreated(res.product);
        onClose();
      } else {
        setError(res.message || 'Failed to create product');
      }
    } catch (err) {
      setError(err.message || 'Error creating product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-pop-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white border-3 border-black rounded-3xl shadow-brutal-xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto z-10 text-black">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FEF08A] border-2 border-black shadow-brutal-sm flex items-center justify-center text-black">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-display font-black text-black">Add New Product</h2>
              <p className="text-[11px] font-bold text-black/70">List an item in your store catalog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white border-2 border-black shadow-brutal-sm hover:bg-[#FF6B97] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-[#FF6B97]/20 border-2 border-black text-xs font-bold text-black flex items-center space-x-2 shadow-brutal-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-black">Product Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Wireless Ergonomic Mechanical Keyboard"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black text-black shadow-brutal-sm focus:bg-[#FEFCE8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-black">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black text-black font-bold shadow-brutal-sm focus:bg-[#FEFCE8]"
              >
                <option value="Electronics">Electronics</option>
                <option value="Audio">Audio</option>
                <option value="Workspace">Workspace</option>
                <option value="Peripherals">Peripherals</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-black">Available Stock *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="25"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black text-black font-mono shadow-brutal-sm focus:bg-[#FEFCE8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-black">Price ($ USD) *</label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="49.99"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black text-black font-mono font-black shadow-brutal-sm focus:bg-[#FEFCE8]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-black">Compare Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.compareAtPrice}
                onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                placeholder="69.99"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black text-black font-mono shadow-brutal-sm focus:bg-[#FEFCE8]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-black">Image URL *</label>
            <input
              type="url"
              required
              value={formData.images}
              onChange={(e) => setFormData({ ...formData, images: e.target.value })}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black text-black shadow-brutal-sm focus:bg-[#FEFCE8]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-black">Description *</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide product details, materials, warranty, and technical specs..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black text-black shadow-brutal-sm focus:bg-[#FEFCE8]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#6EE7B7] hover:bg-[#34D399] text-black font-display font-black text-xs border-2.5 border-black shadow-brutal flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Publishing...' : 'Publish Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
