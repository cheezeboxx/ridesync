const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const redis = require('../src/config/redis');

describe('GET /users/me', () => {
  const email = `profile-${Date.now()}@example.com`;
  const password = 'password123';
  let token;
  let userId;

  beforeAll(async () => {
    const reg = await request(app)
      .post('/auth/register')
      .send({ email, password });
    userId = reg.body.id;

    const login = await request(app)
      .post('/auth/login')
      .send({ email, password });
    token = login.body.token;
  });

  afterAll(async () => {
    await redis.del(`user:${userId}`);
    await pool.query('DELETE FROM users WHERE email = $1', [email]);
    await pool.end();
    await redis.quit();
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/users/me');
    expect(res.statusCode).toBe(401);
  });

  it('returns the profile on the first call (cache MISS)', async () => {
    const res = await request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(email);
    expect(res.headers['x-cache']).toBe('MISS');
  });

  it('serves the second call from the cache (HIT)', async () => {
    const res = await request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers['x-cache']).toBe('HIT');
  });
});