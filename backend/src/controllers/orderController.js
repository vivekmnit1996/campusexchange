import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Store } from '../models/Store.js';
import { ledgerService } from '../services/ledgerService.js';

export const createOrder = async (req, res, next) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    session = null;
  }

  try {
    const { items, customerInfo, paymentMethod = 'credit_card' } = req.body;

    if (!items || items.length === 0) {
      if (session) await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty.' });
    }

    const reservedItems = [];
    const storeSubOrderMap = new Map();

    // 1. Atomic Stock Reservation & Validation
    for (const item of items) {
      const quantity = Number(item.quantity) || 1;

      const product = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: quantity }, isActive: true },
        { $inc: { stock: -quantity } },
        { new: true, session }
      ).populate('store');

      if (!product) {
        if (!session) {
          for (const reserved of reservedItems) {
            await Product.findByIdAndUpdate(reserved.productId, { $inc: { stock: reserved.quantity } });
          }
        } else {
          await session.abortTransaction();
        }

        return res.status(409).json({
          success: false,
          message: `Stock reservation failed: Product "${item.title || item.productId}" has insufficient stock.`,
          error: 'INSUFFICIENT_STOCK_CONFLICT',
        });
      }

      reservedItems.push({
        productId: product._id,
        quantity,
        title: product.title,
        price: product.price,
        image: product.images[0] || '',
        store: product.store,
      });

      // Group by Store for Multi-Vendor Partitioning
      const storeIdStr = product.store._id.toString();
      if (!storeSubOrderMap.has(storeIdStr)) {
        storeSubOrderMap.set(storeIdStr, {
          store: product.store._id,
          vendor: product.store.owner,
          subTotal: 0,
          commissionRate: product.store.commissionRate || 0.1,
          items: [],
        });
      }

      const storeGroup = storeSubOrderMap.get(storeIdStr);
      storeGroup.subTotal += product.price * quantity;
      storeGroup.items.push({
        product: product._id,
        title: product.title,
        price: product.price,
        quantity,
        store: product.store._id,
        image: product.images[0] || '',
      });
    }

    // 2. Build Sub-Orders
    const vendorSubOrders = [];
    let totalPlatformFee = 0;
    let totalVendorPayout = 0;
    let orderTotalAmount = 0;

    for (const [_, group] of storeSubOrderMap) {
      const platformFee = Number((group.subTotal * group.commissionRate).toFixed(2));
      const vendorPayout = Number((group.subTotal - platformFee).toFixed(2));

      vendorSubOrders.push({
        store: group.store,
        vendor: group.vendor,
        subTotal: group.subTotal,
        platformFee,
        vendorPayout,
        status: 'PAID',
        items: group.items,
      });

      totalPlatformFee += platformFee;
      totalVendorPayout += vendorPayout;
      orderTotalAmount += group.subTotal;
    }

    // 3. Persist Order in Database
    const orderNumber = `MP-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const sanitizedCustomerInfo = {
      name: customerInfo?.name || req.user.name || 'Customer',
      email: customerInfo?.email || req.user.email || 'customer@marketpulse.io',
      address: customerInfo?.address || '100 Market St',
      city: customerInfo?.city || 'San Francisco',
      postalCode: customerInfo?.postalCode || '94105',
      country: customerInfo?.country || 'USA',
    };

    const orderPayload = {
      orderNumber,
      customer: req.user._id,
      customerInfo: sanitizedCustomerInfo,
      items: reservedItems.map((i) => ({
        product: i.productId,
        title: i.title,
        price: i.price,
        quantity: i.quantity,
        store: i.store._id,
        image: i.image,
      })),
      vendorSubOrders,
      totalAmount: orderTotalAmount,
      totalPlatformFee,
      totalVendorPayout,
      paymentStatus: 'PAID',
      paymentMethod,
      idempotencyKey: req.headers['idempotency-key'] || req.headers['x-idempotency-key'],
    };

    const createdOrders = await Order.create([orderPayload], { session });
    const order = createdOrders[0];

    // 4. Process Double-Entry Ledger Entries
    await ledgerService.processOrderFinancials(order, session);

    if (session) {
      await session.commitTransaction();
    }

    res.status(201).json({
      success: true,
      message: 'Order placed and partitioned successfully across vendors.',
      order,
    });
  } catch (error) {
    if (session) await session.abortTransaction();
    next(error);
  } finally {
    if (session) session.endSession();
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('vendorSubOrders.store', 'name slug logo')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('vendorSubOrders.store', 'name slug logo owner')
      .populate('items.product', 'title slug');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (
      req.user.role !== 'admin' &&
      order.customer._id.toString() !== req.user._id.toString() &&
      !order.vendorSubOrders.some((v) => v.vendor.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this order.' });
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel an order, restore atomic product inventory, and reverse financials
 */
export const cancelOrder = async (req, res, next) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    session = null;
  }

  try {
    const { id } = req.params;
    const { reason = 'Customer requested cancellation' } = req.body;

    const order = await Order.findById(id).session(session);
    if (!order) {
      if (session) await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Check ownership or admin privilege
    if (req.user.role !== 'admin' && order.customer.toString() !== req.user._id.toString()) {
      if (session) await session.abortTransaction();
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this order.' });
    }

    // Check if order already cancelled
    if (order.paymentStatus === 'REFUNDED' || order.paymentStatus === 'CANCELLED') {
      if (session) await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Order is already cancelled or refunded.' });
    }

    // Check if any sub-order has already shipped
    const alreadyShipped = order.vendorSubOrders.some(
      (sub) => sub.status === 'SHIPPED' || sub.status === 'DELIVERED'
    );

    if (alreadyShipped) {
      if (session) await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'This order has already been dispatched by one or more vendors. Please initiate a return request instead.',
      });
    }

    // 1. Restore inventory for all items atomically
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } },
        { session }
      );
    }

    // 2. Mark sub-orders and main order as CANCELLED & REFUNDED
    order.vendorSubOrders.forEach((sub) => {
      sub.status = 'CANCELLED';
      sub.notes = reason;
    });

    order.paymentStatus = 'REFUNDED';
    await order.save({ session });

    // 3. Process Financial Reversal
    await ledgerService.processCancellationFinancials(order, reason, session);

    if (session) {
      await session.commitTransaction();
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully. Full refund initiated and inventory restored.',
      order,
    });
  } catch (error) {
    if (session) await session.abortTransaction();
    next(error);
  } finally {
    if (session) session.endSession();
  }
};
