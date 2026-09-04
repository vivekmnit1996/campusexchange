// In-memory sliding window rate limiter
const ipRequestMap = new Map();

export const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute window
  const maxRequests = options.max || 100; // limit per window
  const message = options.message || 'Too many requests, please slow down.';

  return (req, res, next) => {
    const identifier = req.user ? `user:${req.user._id}` : `ip:${req.ip || req.connection.remoteAddress || 'unknown'}`;
    const now = Date.now();

    let clientRecord = ipRequestMap.get(identifier);

    if (!clientRecord) {
      clientRecord = { timestamps: [now] };
      ipRequestMap.set(identifier, clientRecord);
    } else {
      // Filter out timestamps older than the sliding window
      clientRecord.timestamps = clientRecord.timestamps.filter((ts) => now - ts < windowMs);
      clientRecord.timestamps.push(now);
    }

    const currentCount = clientRecord.timestamps.length;
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - currentCount));
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

    if (currentCount > maxRequests) {
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: Math.ceil(windowMs / 1000),
      });
    }

    next();
  };
};

// Cleanup old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipRequestMap.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);
    if (record.timestamps.length === 0) {
      ipRequestMap.delete(key);
    }
  }
}, 5 * 60 * 1000);
