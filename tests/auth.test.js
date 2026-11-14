const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('POST /auth/register', () => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'password123';

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', [email]);
    await pool.end();
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
});