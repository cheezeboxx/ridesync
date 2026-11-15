const express = require('express');
const pool = require('../config/db');
const redis = require('../config/redis');
const requireAuth = require('../middleware/auth');

const router = express.Router();
const CACHE_TTL_SECONDS = 60;

router.get('/me', requireAuth, async (req, res) => {
  const userId = req.user.sub;
  const cacheKey = `user:${userId}`;

  // 1. Try the cache. A Redis failure must not break the request.
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.status(200).json(JSON.parse(cached));
    }
  } catch (err) {
    console.error('Cache read failed:', err.message);
  }

  // 2. Cache miss (or Redis down): ask Postgres.
  try {
    const result = await pool.query(
      'SELECT id, email, role, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = result.rows[0];

    // 3. Fill the cache. Again, failure here is only logged.
    try {
      await redis.set(cacheKey, JSON.stringify(user), 'EX', CACHE_TTL_SECONDS);
    } catch (err) {
      console.error('Cache write failed:', err.message);
    }

    res.set('X-Cache', 'MISS');
    return res.status(200).json(user);
  } catch (err) {
    console.error('Profile fetch failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;