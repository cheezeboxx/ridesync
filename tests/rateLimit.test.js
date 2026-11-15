const express = require('express');
const request = require('supertest');
const redis = require('../src/config/redis');
const rateLimit = require('../src/middleware/rateLimit');

describe('rateLimit middleware', () => {
  const id = `test-${Date.now()}`;
  const app = express();

  app.get(
    '/limited',
    rateLimit({
      windowSeconds: 60,
      maxRequests: 3,
      keyPrefix: 'rl:test',
      keyFn: () => id,
    }),
    (req, res) => res.json({ ok: true })
  );

  afterAll(async () => {
    await redis.del(`rl:test:${id}`);
    await redis.quit();
  });

  it('allows requests up to the limit', async () => {
    for (let i = 0; i < 3; i++) {
      const res = await request(app).get('/limited');
      expect(res.statusCode).toBe(200);
    }
  });

  it('returns 429 with Retry-After once the limit is exceeded', async () => {
    const res = await request(app).get('/limited');
    expect(res.statusCode).toBe(429);
    expect(res.headers['retry-after']).toBeDefined();
  });
});