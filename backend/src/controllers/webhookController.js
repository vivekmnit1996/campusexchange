import crypto from 'crypto';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { Order } from '../models/Order.js';

export const handlePaymentWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-marketpulse-signature'] || req.headers['stripe-signature'];
    const secret = process.env.WEBHOOK_SECRET || 'whsec_marketpulse_hmac_sha256_mock_key_2026';
    const payload = req.body;

    if (!payload || !payload.id) {
      return res.status(400).json({ success: false, message: 'Invalid webhook payload structure.' });
    }

    // 1. Verify HMAC-SHA256 Signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const isSignatureValid = signature && signature === expectedSignature;

    // Check duplicate event delivery (Idempotent Webhook Processing)
    const existingEvent = await WebhookEvent.findOne({ eventId: payload.id });
    if (existingEvent) {
      return res.status(200).json({
        success: true,
        message: 'Duplicate event ignored: Event already processed.',
        eventId: payload.id,
      });
    }

    // Record Event
    const webhookLog = await WebhookEvent.create({
      eventId: payload.id,
      eventType: payload.type || 'payment_intent.succeeded',
      source: 'stripe_mock',
      payload,
      signature: signature || 'MISSING',
      status: isSignatureValid ? 'PROCESSED' : 'SIGNATURE_INVALID',
      processedAt: new Date(),
    });

    if (!isSignatureValid) {
      return res.status(401).json({
        success: false,
        message: 'Webhook signature verification failed.',
        expectedSignature,
        receivedSignature: signature,
      });
    }

    // Process Business Logic for verified event
    if (payload.type === 'payment_intent.succeeded' && payload.data?.orderNumber) {
      await Order.findOneAndUpdate(
        { orderNumber: payload.data.orderNumber },
        { paymentStatus: 'PAID' }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Webhook received, verified with HMAC-SHA256, and processed successfully.',
      eventId: payload.id,
    });
  } catch (error) {
    next(error);
  }
};

export const getWebhookLogs = async (req, res, next) => {
  try {
    const logs = await WebhookEvent.find().sort({ createdAt: -1 }).limit(30);
    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
};
