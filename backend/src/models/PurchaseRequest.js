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
    quantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity must be at least 1'],
    },
    totalAmount: {
      type: Number,
      min: [0, 'Total amount cannot be negative'],
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
    cancellationReason: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
    },
    cancelledAt: {
      type: Date,
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
