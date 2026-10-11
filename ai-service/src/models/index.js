import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    condition: { type: String, default: 'Good' },
    image: { type: String, default: '' },
    images: [String],
    pickupLocation: { type: String, default: 'Campus Hostel Gate' },
    status: { type: String, default: 'AVAILABLE' },
    reasonForSelling: { type: String, default: 'Graduating' },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, default: 'BUYER' },
    college: { type: String, default: 'MNIT Jaipur' },
    hostel: { type: String, default: 'Hostel 5' },
    phone: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export const User = mongoose.models.User || mongoose.model('User', userSchema);
