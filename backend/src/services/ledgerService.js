import crypto from 'crypto';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { Store } from '../models/Store.js';
import { User } from '../models/User.js';

export const ledgerService = {
  /**
   * Records a double-entry set of ledger transactions for a completed multi-vendor order.
   * @param {Object} order The created order document
   * @param {Object} session Mongoose session for ACID transaction
   */
  async processOrderFinancials(order, session = null) {
    const txId = `TX-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const entries = [];

    // 1. Debit customer wallet/account
    const customer = await User.findById(order.customer).session(session);
    const customerBalanceAfter = customer ? customer.walletBalance : 0;

    entries.push({
      transactionId: txId,
      order: order._id,
      user: order.customer,
      type: 'CUSTOMER_DEBIT',
      amount: -order.totalAmount,
      balanceAfter: customerBalanceAfter,
      description: `Payment for Order #${order.orderNumber}`,
      metadata: { orderNumber: order.orderNumber, paymentMethod: order.paymentMethod },
    });

    // 2. Process each vendor sub-order
    for (const subOrder of order.vendorSubOrders) {
      const store = await Store.findById(subOrder.store).session(session);
      if (!store) continue;

      // Credit vendor payout balance
      const newVendorBalance = (store.balance || 0) + subOrder.vendorPayout;
      store.balance = newVendorBalance;
      store.totalRevenue = (store.totalRevenue || 0) + subOrder.subTotal;
      await store.save({ session });

      entries.push({
        transactionId: txId,
        order: order._id,
        store: subOrder.store,
        user: subOrder.vendor,
        type: 'VENDOR_CREDIT',
        amount: subOrder.vendorPayout,
        balanceAfter: newVendorBalance,
        description: `Vendor proceeds for Sub-Order #${order.orderNumber}-${store.slug}`,
        metadata: { subTotal: subOrder.subTotal, commissionRate: store.commissionRate },
      });

      // Platform commission fee
      entries.push({
        transactionId: txId,
        order: order._id,
        store: subOrder.store,
        type: 'PLATFORM_COMMISSION',
        amount: subOrder.platformFee,
        balanceAfter: subOrder.platformFee,
        description: `Marketplace take-rate fee (${(store.commissionRate * 100).toFixed(0)}%) for Order #${order.orderNumber}`,
        metadata: { subTotal: subOrder.subTotal },
      });
    }

    // Save all entries
    return LedgerEntry.insertMany(entries, { session });
  },

  /**
   * Reverses ledger entries and adjusts merchant / customer balances upon cancellation / refund.
   */
  async processCancellationFinancials(order, reason = 'Customer Cancellation', session = null) {
    const txId = `REFUND-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const entries = [];

    // 1. Credit customer refund
    entries.push({
      transactionId: txId,
      order: order._id,
      user: order.customer,
      type: 'REFUND_CREDIT',
      amount: order.totalAmount,
      balanceAfter: 0,
      description: `Refund for Cancelled Order #${order.orderNumber}: ${reason}`,
      metadata: { orderNumber: order.orderNumber, reason },
    });

    // 2. Debit vendor proceeds back and adjust store balances
    for (const subOrder of order.vendorSubOrders) {
      const store = await Store.findById(subOrder.store).session(session);
      if (store) {
        store.balance = Math.max(0, (store.balance || 0) - subOrder.vendorPayout);
        store.totalRevenue = Math.max(0, (store.totalRevenue || 0) - subOrder.subTotal);
        await store.save({ session });

        entries.push({
          transactionId: txId,
          order: order._id,
          store: subOrder.store,
          user: subOrder.vendor,
          type: 'VENDOR_DEBIT_REVERSAL',
          amount: -subOrder.vendorPayout,
          balanceAfter: store.balance,
          description: `Reversal of payout for cancelled Sub-Order #${order.orderNumber}`,
          metadata: { subTotal: subOrder.subTotal },
        });
      }
    }

    return LedgerEntry.insertMany(entries, { session });
  },

  /**
   * Calculates ledger totals and checks reconciliation balance.
   */
  async getLedgerAuditSummary() {
    const totals = await LedgerEntry.aggregate([
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    return totals;
  },
};
