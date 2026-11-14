const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const redis = require('../src/config/redis');


describe('POST /auth/register', () => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'password123';

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', [email]);
    await pool.end();
    await redis.quit();
  });

  it('registers a new user and hides the password hash', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email, password });

    expect(res.statusCode).toBe(201);
    expect(res.body.email).toBe(email);
    expect(res.body.password_hash).toBeUndefined();
  });

  it('returns 409 when the email is already registered', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email, password });

    expect(res.statusCode).toBe(409);
  });

  it('returns 400 when the password is too short', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: `short-${Date.now()}@example.com`, password: '123' });

    expect(res.statusCode).toBe(400);
  });
  it('logs in with correct credentials and returns a token', async () => {
    const res = await request(app)
        .post('/auth/login')
        .send({ email, password });

    expect(res.statusCode).toBe(200);
    expect(typeof res.body.token).toBe('string');
    token = res.body.token;
    });

    it('returns 401 for a wrong password', async () => {
    const res = await request(app)
        .post('/auth/login')
        .send({ email, password: 'wrong-password' });

    expect(res.statusCode).toBe(401);
    });

    it('returns the user on /auth/me with a valid token', async () => {
    const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.role).toBe('rider');
    });

    it('returns 401 on /auth/me with no token', async () => {
    const res = await request(app).get('/auth/me');

    expect(res.statusCode).toBe(401);
    });
});