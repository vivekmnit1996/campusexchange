import mongoose from 'mongoose';

const purchaseRequestSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer is required'],
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'],
      default: 'PENDING',
      index: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    pickupLocation: {
      type: String,
      default: 'Campus Hostel Gate',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast query resolution
purchaseRequestSchema.index({ buyer: 1, createdAt: -1 });
purchaseRequestSchema.index({ seller: 1, createdAt: -1 });
purchaseRequestSchema.index({ product: 1, status: 1 });

export const PurchaseRequest = mongoose.model('PurchaseRequest', purchaseRequestSchema);
// Alias for backward compatibility
export const Order = PurchaseRequest;
