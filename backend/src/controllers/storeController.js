import { Store } from '../models/Store.js';
import { Product } from '../models/Product.js';

export const getStoreBySlug = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    let store = await Store.findOne({
      $or: [{ slug: identifier }, { _id: identifier.match(/^[0-9a-fA-F]{24}$/) ? identifier : null }],
    }).populate('owner', 'name avatar email');

    if (!store) {
      return res.status(404).json({ success: false, message: 'Vendor store not found.' });
    }

    const products = await Product.find({ store: store._id, isActive: true }).sort({ createdAt: -1 });

    res.json({
      success: true,
      store,
      productsCount: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllStores = async (req, res, next) => {
  try {
    const stores = await Store.find({ isActive: true }).populate('owner', 'name avatar');
    res.json({ success: true, count: stores.length, stores });
  } catch (error) {
    next(error);
  }
};
