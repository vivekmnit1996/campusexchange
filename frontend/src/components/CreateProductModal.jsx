import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import {
  X,
  Plus,
  Package,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Edit3,
} from 'lucide-react';

export const CreateProductModal = ({
  isOpen,
  onClose,
  onProductCreated,
  productToEdit = null,
  onProductUpdated = null,
}) => {
  const isEditing = Boolean(productToEdit);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Calculators',
    condition: 'Like New',
    reasonForSelling: 'Graduating',
    pickupLocation: 'Hostel 5 Gate / Central Lawn',
    price: '',
    compareAtPrice: '',
    quantity: '1',
    description: '',
    image: '',
    imagePublicId: '',
  });

  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (productToEdit) {
      const initialImg =
        productToEdit.image ||
        (productToEdit.images && productToEdit.images[0]) ||
        '';
      const initialQty =
        productToEdit.quantity !== undefined
          ? String(productToEdit.quantity)
          : productToEdit.stock !== undefined
          ? String(productToEdit.stock)
          : '1';
      setFormData({
        title: productToEdit.title || '',
        category: productToEdit.category || 'Calculators',
        condition: productToEdit.condition || 'Like New',
        reasonForSelling: productToEdit.reasonForSelling || 'Graduating',
        pickupLocation: productToEdit.pickupLocation || 'Hostel 5 Gate / Central Lawn',
        price: productToEdit.price !== undefined ? String(productToEdit.price) : '',
        compareAtPrice: productToEdit.compareAtPrice !== undefined ? String(productToEdit.compareAtPrice) : '',
        quantity: initialQty,
        description: productToEdit.description || '',
        image: initialImg,
        imagePublicId: productToEdit.imagePublicId || '',
      });
      setImagePreview(initialImg);
    } else {
      setFormData({
        title: '',
        category: 'Calculators',
        condition: 'Like New',
        reasonForSelling: 'Graduating',
        pickupLocation: 'Hostel 5 Gate / Central Lawn',
        price: '',
        compareAtPrice: '',
        quantity: '1',
        description: '',
        image: '',
        imagePublicId: '',
      });
      setImagePreview('');
    }
    setError(null);
    setUploadError(null);
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate client-side
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid format. Please select a JPEG, PNG, or WebP photo.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('File is too large. Image size must be under 5MB.');
      return;
    }

    // Immediate local preview
    const localPreviewUrl = URL.createObjectURL(file);
    setImagePreview(localPreviewUrl);

    // Upload to server/Cloudinary
    setUploadingImage(true);
    try {
      const uploadRes = await api.uploadImage(file);
      if (uploadRes?.success && uploadRes.imageUrl) {
        setFormData((prev) => ({
          ...prev,
          image: uploadRes.imageUrl,
          imagePublicId: uploadRes.publicId || '',
        }));
        setImagePreview(uploadRes.imageUrl);
      } else {
        setUploadError(uploadRes?.message || 'Failed to upload photo. Please try again.');
        // Revert if error
        if (!formData.image) setImagePreview('');
      }
    } catch (err) {
      setUploadError(err.message || 'Network error during upload');
    } finally {
      setUploadingImage(false);
      // Reset input value so same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setFormData((prev) => ({ ...prev, image: '', imagePublicId: '' }));
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (uploadingImage) {
      setError('Please wait for the image upload to complete.');
      setLoading(false);
      return;
    }

    try {
      const finalImage =
        formData.image ||
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';

      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        condition: formData.condition,
        reasonForSelling: formData.reasonForSelling,
        pickupLocation: formData.pickupLocation.trim(),
        price: Number(formData.price),
        compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : undefined,
        quantity: Math.max(1, parseInt(formData.quantity, 10) || 1),
        description: formData.description.trim(),
        image: finalImage,
        images: [finalImage],
        imagePublicId: formData.imagePublicId || '',
      };

      if (isEditing) {
        const res = await api.updateProduct(productToEdit._id, payload);
        if (res.success) {
          if (onProductUpdated) onProductUpdated(res.product);
          onClose();
        } else {
          setError(res.message || 'Failed to update listing');
        }
      } else {
        const res = await api.createProduct(payload);
        if (res.success) {
          if (onProductCreated) onProductCreated(res.product);
          onClose();
        } else {
          setError(res.message || 'Failed to publish listing');
        }
      }
    } catch (err) {
      setError(err.message || 'Error saving listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-pop-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-[#121522] border-3 border-black rounded-3xl shadow-brutal-xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto z-10 text-black dark:text-white">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FEF08A] dark:bg-[#FFE600] border-2 border-black shadow-brutal-sm flex items-center justify-center text-black">
              {isEditing ? <Edit3 className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-display font-black text-black dark:text-white">
                {isEditing ? 'Edit Campus Listing' : 'Create Campus Listing'}
              </h2>
              <p className="text-[11px] font-bold text-black/70 dark:text-slate-300">
                {isEditing
                  ? 'Update details or replace photo for your item'
                  : 'List pre-loved second-hand items for fellow students'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm hover:bg-[#FF6B97] hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-[#FF6B97]/20 border-2 border-black text-xs font-bold text-black dark:text-white flex items-center space-x-2 shadow-brutal-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-black dark:text-white">Item Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Casio fx-991EX Calculator / Firefox Mountain Bike 29T"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black text-black dark:text-white shadow-brutal-sm focus:bg-[#FEFCE8] dark:focus:bg-[#252A42]"
            />
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-black dark:text-white">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black text-black dark:text-white font-bold shadow-brutal-sm"
              >
                <option value="Calculators">Calculators</option>
                <option value="Books">Books</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Sports equipment">Sports equipment</option>
                <option value="Notes/study material">Notes/study material</option>
                <option value="Other useful student items">Other useful student items</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-black dark:text-white">Condition *</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black text-black dark:text-white font-bold shadow-brutal-sm"
              >
                <option value="Like New">Like New (barely used)</option>
                <option value="Good">Good (fully working, gentle wear)</option>
                <option value="Fair">Fair (functional with visible signs)</option>
                <option value="New">Brand New / Unopened</option>
              </select>
            </div>
          </div>

          {/* Reason & Pickup Spot */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-black dark:text-white">Reason For Selling *</label>
              <select
                value={formData.reasonForSelling}
                onChange={(e) => setFormData({ ...formData, reasonForSelling: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black text-black dark:text-white font-bold shadow-brutal-sm"
              >
                <option value="Graduating">Graduating</option>
                <option value="Leaving Hostel">Leaving Hostel</option>
                <option value="Moving Out">Moving Out</option>
                <option value="No Longer Needed">No Longer Needed</option>
                <option value="Upgrading">Upgrading</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-black dark:text-white">Campus Pickup Spot *</label>
              <input
                type="text"
                required
                value={formData.pickupLocation}
                onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                placeholder="e.g. Hostel 5 Gate / Central Library"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black text-black dark:text-white shadow-brutal-sm"
              />
            </div>
          </div>

          {/* Price, MRP & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-black dark:text-white">Price (₹ INR) *</label>
              <input
                type="number"
                step="1"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="650"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black text-black dark:text-white font-mono font-black shadow-brutal-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-black dark:text-white">Original / MRP (₹)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.compareAtPrice}
                onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                placeholder="1395"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black text-black dark:text-white font-mono shadow-brutal-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-black dark:text-white">Quantity *</label>
              <input
                type="number"
                step="1"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black text-black dark:text-white font-mono font-black shadow-brutal-sm"
              />
            </div>
          </div>

          {/* Actual Image Upload Field (Section 7) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase text-black dark:text-white">
                Item Photo (Upload from device)
              </label>
              <span className="text-[10px] font-mono text-black/60 dark:text-slate-400">
                JPEG, PNG, WebP • Max 5MB
              </span>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative rounded-2xl border-2.5 border-black overflow-hidden bg-slate-100 dark:bg-[#1A1E30] shadow-brutal-sm p-3">
                <div className="flex items-center space-x-3">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-black shrink-0 bg-white">
                    <img
                      src={imagePreview}
                      alt="Upload preview"
                      className="w-full h-full object-cover"
                    />
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{uploadingImage ? 'Uploading photo...' : 'Photo Attached'}</span>
                    </div>
                    <p className="text-[10px] font-mono text-black/60 dark:text-slate-400 truncate">
                      {formData.image ? 'Uploaded & ready' : 'Selected from device'}
                    </p>

                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        disabled={uploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#121522] border border-black text-[10px] font-bold shadow-xs hover:bg-slate-50 transition cursor-pointer"
                      >
                        Replace Image
                      </button>
                      <button
                        type="button"
                        disabled={uploadingImage}
                        onClick={handleRemoveImage}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-black text-[10px] font-bold shadow-xs hover:bg-rose-100 transition cursor-pointer flex items-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
                className="border-2 border-dashed border-black dark:border-slate-500 rounded-2xl p-5 text-center bg-slate-50 dark:bg-[#1A1E30] hover:bg-slate-100 dark:hover:bg-[#252A42] transition cursor-pointer shadow-brutal-xs flex flex-col items-center justify-center space-y-2 group"
              >
                <div className="w-11 h-11 rounded-xl bg-[#FEF08A] dark:bg-[#FFE600] border-2 border-black shadow-brutal-xs flex items-center justify-center text-black group-hover:scale-105 transition">
                  {uploadingImage ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-display font-black text-black dark:text-white">
                    {uploadingImage ? 'Uploading Photo...' : 'Click to Upload Image'}
                  </div>
                  <div className="text-[10px] font-mono text-black/60 dark:text-slate-400 mt-0.5">
                    Supports JPEG, PNG, WebP (Max 5MB)
                  </div>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-black dark:text-white">Item Description & Notes *</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe condition details, how long you used it, accessories included (e.g. charger, formula sheets)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black text-black dark:text-white shadow-brutal-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="w-full py-3 rounded-xl bg-[#6EE7B7] hover:bg-[#34D399] text-black font-display font-black text-xs border-2.5 border-black shadow-brutal flex items-center justify-center space-x-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              {isEditing ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'Saving Changes...' : 'Save Listing Updates'}</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{loading ? 'Publishing...' : 'Publish Campus Listing'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
