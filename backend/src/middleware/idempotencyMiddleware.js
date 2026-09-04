import crypto from 'crypto';
import { IdempotencyRecord } from '../models/IdempotencyRecord.js';

export const idempotencyMiddleware = async (req, res, next) => {
  const key = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];

  // Only apply to state-modifying requests (POST, PUT, PATCH)
  if (!key || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  try {
    const rawBody = req.body ? JSON.stringify(req.body) : '';
    const requestHash = crypto.createHash('sha256').update(rawBody).digest('hex');

    const existing = await IdempotencyRecord.findOne({ key });

    if (existing) {
      if (existing.requestHash !== requestHash) {
        return res.status(422).json({
          success: false,
          message: 'Idempotency Conflict: Key was previously used with a different request payload.',
          error: 'IDEMPOTENCY_PAYLOAD_MISMATCH',
        });
      }

      // Return cached idempotent response
      res.setHeader('X-Cache-Lookup', 'IDEMPOTENT-HIT');
      res.setHeader('X-Idempotency-Key', key);
      return res.status(existing.statusCode).json(existing.responseBody);
    }

    // Intercept response to save upon completion
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      // Restore original method
      res.json = originalJson;

      // Only cache successful or definitive business responses (not 500 server crashes)
      if (res.statusCode < 500) {
        IdempotencyRecord.create({
          key,
          user: req.user ? req.user._id : undefined,
          endpoint: `${req.method} ${req.originalUrl}`,
          requestHash,
          statusCode: res.statusCode,
          responseBody: body,
        }).catch((err) => console.error('Error storing idempotency record:', err.message));
      }

      res.setHeader('X-Cache-Lookup', 'IDEMPOTENT-MISS-STORED');
      res.setHeader('X-Idempotency-Key', key);
      return originalJson(body);
    };

    next();
  } catch (error) {
    console.error('Idempotency middleware error:', error);
    next();
  }
};
