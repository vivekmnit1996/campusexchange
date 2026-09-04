import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    image: { type: String },
  },
  { _id: false }
);

const vendorSubOrderSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subTotal: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, required: true, min: 0 },
    vendorPayout: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
      default: 'PAID',
      index: true,
    },
    items: [orderItemSchema],
    trackingNumber: { type: String, default: '' },
    carrier: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customerInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'USA' },
    },
    items: [orderItemSchema],
    vendorSubOrders: [vendorSubOrderSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPlatformFee: {
      type: Number,
      required: true,
      default: 0,
    },
    totalVendorPayout: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PAID',
      index: true,
    },
    paymentMethod: {
      type: String,
      default: 'credit_card',
    },
    paymentIntentId: {
      type: String,
    },
    idempotencyKey: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ 'vendorSubOrders.store': 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
