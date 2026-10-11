import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { PurchaseRequest } from '../models/PurchaseRequest.js';

export const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(),
    ]);

    res.json({
      success: true,
      count: users.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      users,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json({ success: false, message: 'Cannot delete an administrator account.' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User account removed by administrator.',
    });
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find()
        .populate('seller', 'name email college branch year hostel phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(),
    ]);

    res.json({
      success: true,
      count: products.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      products,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product listing not found.' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product listing removed by administrator.',
    });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalBuyers,
      totalSellers,
      totalListings,
      availableListings,
      reservedListings,
      soldListings,
      totalRequests,
      completedExchanges,
      categoryDistribution,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'BUYER' }),
      User.countDocuments({ role: 'SELLER' }),
      Product.countDocuments(),
      Product.countDocuments({ status: 'AVAILABLE' }),
      Product.countDocuments({ status: 'RESERVED' }),
      Product.countDocuments({ status: 'SOLD' }),
      PurchaseRequest.countDocuments(),
      PurchaseRequest.countDocuments({ status: 'COMPLETED' }),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalBuyers,
        totalSellers,
        totalListings,
        availableListings,
        reservedListings,
        soldListings,
        totalRequests,
        completedExchanges,
        categoryDistribution,
      },
      // Compatibility keys for existing frontend
      kpis: {
        totalStudents: totalUsers,
        verifiedStudents: totalUsers,
        totalListings,
        activeListings: availableListings,
        itemsAvailable: availableListings,
        itemsSold: soldListings,
        itemsReserved: reservedListings,
        totalReservations: totalRequests,
        totalGMV: 0,
        totalVendorPayouts: 0,
        avgOrderValue: 0,
      },
      categoryBreakdown: categoryDistribution,
      vendorLeaderboard: [],
    });
  } catch (error) {
    next(error);
  }
};
