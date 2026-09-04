import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Store } from '../models/Store.js';
import { Product } from '../models/Product.js';
import { LedgerEntry } from '../models/LedgerEntry.js';

export const getPlatformAnalytics = async (req, res, next) => {
  try {
    // 1. Core KPIs Aggregation
    const kpiAggregation = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalGMV: { $sum: '$totalAmount' },
          totalPlatformRevenue: { $sum: '$totalPlatformFee' },
          totalVendorPayouts: { $sum: '$totalVendorPayout' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' },
        },
      },
    ]);

    const kpis = kpiAggregation[0] || {
      totalGMV: 0,
      totalPlatformRevenue: 0,
      totalVendorPayouts: 0,
      orderCount: 0,
      avgOrderValue: 0,
    };

    // 2. Sales Trend (Past 14 Days)
    const salesTrend = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          dailyGMV: { $sum: '$totalAmount' },
          dailyRevenue: { $sum: '$totalPlatformFee' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 3. Vendor Leaderboard Aggregation
    const vendorLeaderboard = await Order.aggregate([
      { $unwind: '$vendorSubOrders' },
      {
        $group: {
          _id: '$vendorSubOrders.store',
          totalSales: { $sum: '$vendorSubOrders.subTotal' },
          subOrderCount: { $sum: 1 },
          totalFeePaid: { $sum: '$vendorSubOrders.platformFee' },
        },
      },
      {
        $lookup: {
          from: 'stores',
          localField: '_id',
          foreignField: '_id',
          as: 'storeDetails',
        },
      },
      { $unwind: '$storeDetails' },
      {
        $project: {
          storeId: '$_id',
          storeName: '$storeDetails.name',
          storeSlug: '$storeDetails.slug',
          logo: '$storeDetails.logo',
          totalSales: 1,
          subOrderCount: 1,
          totalFeePaid: 1,
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
    ]);

    // 4. Category Breakdown Aggregation
    const categoryBreakdown = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      kpis: {
        totalGMV: Number(kpis.totalGMV.toFixed(2)),
        totalPlatformRevenue: Number(kpis.totalPlatformRevenue.toFixed(2)),
        totalVendorPayouts: Number(kpis.totalVendorPayouts.toFixed(2)),
        orderCount: kpis.orderCount,
        avgOrderValue: Number((kpis.avgOrderValue || 0).toFixed(2)),
      },
      salesTrend,
      vendorLeaderboard,
      categoryBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorAnalytics = async (req, res, next) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Vendor store not found.' });
    }

    const storeId = store._id;

    // 1. Vendor Sales Breakdown
    const vendorSales = await Order.aggregate([
      { $unwind: '$vendorSubOrders' },
      { $match: { 'vendorSubOrders.store': storeId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$vendorSubOrders.vendorPayout' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 2. Top Performing Products for this Vendor
    const topProducts = await Order.aggregate([
      { $unwind: '$vendorSubOrders' },
      { $match: { 'vendorSubOrders.store': storeId } },
      { $unwind: '$vendorSubOrders.items' },
      {
        $group: {
          _id: '$vendorSubOrders.items.title',
          unitsSold: { $sum: '$vendorSubOrders.items.quantity' },
          revenue: { $sum: { $multiply: ['$vendorSubOrders.items.price', '$vendorSubOrders.items.quantity'] } },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      storeName: store.name,
      vendorSales,
      topProducts,
    });
  } catch (error) {
    next(error);
  }
};
