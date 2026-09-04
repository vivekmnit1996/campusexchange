import { Store } from '../models/Store.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { LedgerEntry } from '../models/LedgerEntry.js';

export const getVendorDashboard = async (req, res, next) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Vendor store not found.' });
    }

    const [productCount, subOrders, ledgerEntries] = await Promise.all([
      Product.countDocuments({ store: store._id }),
      Order.find({ 'vendorSubOrders.store': store._id }).sort({ createdAt: -1 }).limit(10),
      LedgerEntry.find({ store: store._id }).sort({ createdAt: -1 }).limit(15),
    ]);

    // Calculate pending fulfillment count
    let pendingFulfillment = 0;
    subOrders.forEach((o) => {
      o.vendorSubOrders.forEach((vso) => {
        if (vso.store.toString() === store._id.toString() && ['PAID', 'PROCESSING'].includes(vso.status)) {
          pendingFulfillment++;
        }
      });
    });

    res.json({
      success: true,
      store: {
        id: store._id,
        name: store.name,
        slug: store.slug,
        balance: store.balance,
        totalRevenue: store.totalRevenue,
        commissionRate: store.commissionRate,
        isApproved: store.isApproved,
      },
      stats: {
        productCount,
        pendingFulfillment,
        currentBalance: store.balance,
        lifetimeSales: store.totalRevenue,
      },
      recentOrders: subOrders,
      recentLedger: ledgerEntries,
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorSubOrders = async (req, res, next) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Vendor store not found.' });
    }

    const orders = await Order.find({ 'vendorSubOrders.store': store._id })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    // Filter down to this vendor's sub-order items for clean presentation
    const formatted = orders.map((order) => {
      const vso = order.vendorSubOrders.find((s) => s.store.toString() === store._id.toString());
      return {
        orderId: order._id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        customerInfo: order.customerInfo,
        subOrder: vso,
      };
    });

    res.json({ success: true, count: formatted.length, subOrders: formatted });
  } catch (error) {
    next(error);
  }
};

export const updateSubOrderStatus = async (req, res, next) => {
  try {
    const { orderId, subOrderId } = req.params;
    const { status, trackingNumber, carrier, notes } = req.body;

    const store = await Store.findOne({ owner: req.user._id });
    if (!store && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const subOrder = order.vendorSubOrders.id(subOrderId);
    if (!subOrder) {
      return res.status(404).json({ success: false, message: 'Vendor sub-order not found.' });
    }

    // Verify ownership
    if (req.user.role !== 'admin' && subOrder.store.toString() !== store._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this sub-order.' });
    }

    if (status) subOrder.status = status;
    if (trackingNumber) subOrder.trackingNumber = trackingNumber;
    if (carrier) subOrder.carrier = carrier;
    if (notes) subOrder.notes = notes;

    await order.save();

    res.json({
      success: true,
      message: `Sub-order status updated to ${status}`,
      subOrder,
    });
  } catch (error) {
    next(error);
  }
};
