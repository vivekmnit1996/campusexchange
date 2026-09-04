import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Store name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Store owner is required'],
      index: true,
    },
    description: {
      type: String,
      default: 'Authorized premium marketplace vendor.',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    logo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=256&q=80',
    },
    banner: {
      type: String,
      default: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
    },
    commissionRate: {
      type: Number,
      default: 0.10, // 10% platform take-rate
      min: [0, 'Commission cannot be negative'],
      max: [1, 'Commission cannot exceed 100%'],
    },
    balance: {
      type: Number,
      default: 0.0,
      min: [0, 'Balance cannot be negative'],
    },
    totalRevenue: {
      type: Number,
      default: 0.0,
    },
    isApproved: {
      type: Boolean,
      default: true,
      index: true,
    },
    payoutEmail: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Store = mongoose.model('Store', storeSchema);
