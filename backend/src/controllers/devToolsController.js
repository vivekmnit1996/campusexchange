import crypto from 'crypto';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { seedDatabase } from '../scripts/seedData.js';

export const simulateConcurrency = async (req, res, next) => {
  try {
    const { initialStock = 3, concurrentRequests = 20 } = req.body;

    // 1. Find or create a dedicated stress-test product
    let testProduct = await Product.findOne({ title: '⚡ Flash Sale Exclusive - Ultra Soundbar' });
    if (!testProduct) {
      testProduct = await Product.findOne({ isActive: true });
    }

    if (!testProduct) {
      return res.status(404).json({ success: false, message: 'No product available for testing. Please seed the DB.' });
    }

    // Set stock to initialStock
    testProduct.stock = initialStock;
    await testProduct.save();

    const customer = await User.findOne({ role: 'customer' });

    const startTime = Date.now();
    const results = [];

    // 2. Launch N concurrent checkout attempts simultaneously using Promise.all
    const promises = Array.from({ length: concurrentRequests }, async (_, index) => {
      const requestId = `req_${index + 1}`;
      try {
        // Atomic deduction with stock guard
        const updated = await Product.findOneAndUpdate(
          { _id: testProduct._id, stock: { $gte: 1 }, isActive: true },
          { $inc: { stock: -1 } },
          { new: true }
        );

        if (updated) {
          results.push({
            requestId,
            status: 'SUCCESS',
            message: 'Stock reserved & Order partitioned',
            remainingStock: updated.stock,
          });
        } else {
          results.push({
            requestId,
            status: 'REJECTED',
            message: '409 Conflict: Insufficient stock (Atomic Lock Guard)',
          });
        }
      } catch (err) {
        results.push({
          requestId,
          status: 'ERROR',
          message: err.message,
        });
      }
    });

    await Promise.all(promises);
    const durationMs = Date.now() - startTime;

    // Verify final stock
    const finalProduct = await Product.findById(testProduct._id);

    const successCount = results.filter((r) => r.status === 'SUCCESS').length;
    const rejectedCount = results.filter((r) => r.status === 'REJECTED').length;

    res.json({
      success: true,
      summary: {
        totalSimulatedRequests: concurrentRequests,
        initialStock,
        finalStock: finalProduct.stock,
        successfulOrders: successCount,
        rejectedConflicts: rejectedCount,
        oversellDetected: finalProduct.stock < 0,
        zeroOversellGuaranteed: successCount <= initialStock && finalProduct.stock >= 0,
        executionTimeMs: durationMs,
      },
      detailedLogs: results,
    });
  } catch (error) {
    next(error);
  }
};

export const generateSignedWebhook = async (req, res, next) => {
  try {
    const { orderNumber = 'MP-TEST-999', amount = 149.99, tamperSignature = false } = req.body;
    const secret = process.env.WEBHOOK_SECRET || 'whsec_marketpulse_hmac_sha256_mock_key_2026';

    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const payload = {
      id: eventId,
      object: 'event',
      type: 'payment_intent.succeeded',
      created: Math.floor(Date.now() / 1000),
      data: {
        orderNumber,
        amount: Math.round(amount * 100),
        currency: 'usd',
        status: 'succeeded',
      },
    };

    const signature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const finalSignature = tamperSignature ? `${signature}_tampered_invalid` : signature;

    res.json({
      success: true,
      headers: {
        'Content-Type': 'application/json',
        'X-MarketPulse-Signature': finalSignature,
      },
      payload,
      isTampered: tamperSignature,
    });
  } catch (error) {
    next(error);
  }
};

export const reseedDatabase = async (req, res, next) => {
  try {
    const result = await seedDatabase();
    res.json({ success: true, message: 'Database reset & seeded with fresh multi-vendor data!', result });
  } catch (error) {
    next(error);
  }
};
