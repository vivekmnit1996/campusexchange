import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      index: true,
    },
    condition: {
      type: String,
      enum: ['New', 'Like New', 'Good', 'Fair'],
      default: 'Good',
      index: true,
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    },
    images: [
      {
        type: String,
      },
    ],
    imagePublicId: {
      type: String,
      default: '',
    },
    pickupLocation: {
      type: String,
      default: 'Campus Hostel Gate',
      trim: true,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'RESERVED', 'SOLD'],
      default: 'AVAILABLE',
      index: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: [0, 'Quantity cannot be negative'],
    },
    stock: {
      type: Number,
      default: 1,
      min: [0, 'Stock cannot be negative'],
    },
    reasonForSelling: {
      type: String,
      default: 'Graduating',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound and text indexes for search and filtering
productSchema.index({ status: 1, category: 1, price: 1 });
productSchema.index({ seller: 1, status: 1 });
productSchema.index({ title: 'text', description: 'text' });

// Ensure image & images stay in sync, and quantity & stock stay in sync
productSchema.pre('save', function (next) {
  if (this.image && (!this.images || this.images.length === 0)) {
    this.images = [this.image];
  } else if ((!this.image || this.image === '') && this.images && this.images.length > 0) {
    this.image = this.images[0];
  }

  // Synchronize quantity and stock
  if (this.quantity !== undefined && this.stock === undefined) {
    this.stock = this.quantity;
  } else if (this.stock !== undefined && this.quantity === undefined) {
    this.quantity = this.stock;
  } else if (this.quantity !== undefined && this.stock !== undefined) {
    this.stock = this.quantity;
  }
  next();
});

export const Product = mongoose.model('Product', productSchema);
