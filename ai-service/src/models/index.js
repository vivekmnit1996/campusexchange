import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    stock: { type: Number, default: 0 },
    category: { type: String, required: true },
    tags: [String],
    images: [String],
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    rating: { type: Number, default: 5.0 },
    numReviews: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    attributes: { type: Map, of: String }
  },
  { timestamps: true }
);

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String },
    logo: { type: String },
    banner: { type: String },
    commissionRate: { type: Number, default: 0.10 },
    balance: { type: Number, default: 0.0 },
    totalRevenue: { type: Number, default: 0.0 },
    isApproved: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerInfo: {
      name: String,
      email: String,
      address: String,
      city: String,
      postalCode: String,
      country: String
    },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        title: String,
        price: Number,
        quantity: Number,
        store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
        image: String
      }
    ],
    vendorSubOrders: [
      {
        store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        subTotal: Number,
        platformFee: Number,
        vendorPayout: Number,
        status: String,
        trackingNumber: String,
        carrier: String
      }
    ],
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, default: 'PAID' }
  },
  { timestamps: true }
);

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export const Store = mongoose.models.Store || mongoose.model('Store', storeSchema);
export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
