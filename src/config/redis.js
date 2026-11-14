require('dotenv').config({ quiet: true });
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: 1,
  connectTimeout: 2000,
});

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});

module.exports = redis;