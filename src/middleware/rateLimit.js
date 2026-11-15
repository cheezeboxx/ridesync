const redis = require('../config/redis');

function rateLimit({
  windowSeconds,
  maxRequests,
  keyPrefix = 'ratelimit',
  keyFn = (req) => req.ip,
}) {
  return async (req, res, next) => {
    const key = `${keyPrefix}:${keyFn(req)}`;

    try {
      // MULTI runs these three commands as one atomic unit, so a crash
      // can't leave a counter without an expiry.
      const results = await redis
        .multi()
        .set(key, 0, 'EX', windowSeconds, 'NX') // create with TTL only if missing
        .incr(key)
        .ttl(key)
        .exec();

      const failed = results.find(([err]) => err);
      if (failed) throw failed[0];

      const count = results[1][1];
      const ttl = results[2][1];

      res.set('X-RateLimit-Limit', String(maxRequests));
      res.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - count)));

      if (count > maxRequests) {
        res.set('Retry-After', String(ttl > 0 ? ttl : windowSeconds));
        return res.status(429).json({ error: 'Too many requests' });
      }
    } catch (err) {
      // Fail open: if Redis is down, let the request through.
      console.error('Rate limiter unavailable, failing open:', err.message);
    }

    next();
  };
}

module.exports = rateLimit;