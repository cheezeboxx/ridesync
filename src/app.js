const express = require('express');

const app = express();
const pool = require('./config/db')
const redis = require('./config/redis');

app.use(express.json());
app.use('/auth', require('./routes/auth'));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error('DB health check failed:', err);
    res.status(503).json({ status: 'error', database: 'unreachable' });
  }
});

app.get('/health/redis', async (req, res) => {
  try {
    await redis.ping();
    res.status(200).json({ status: 'ok', redis: 'connected' });
  } catch (err) {
    console.error('Redis health check failed:', err);
    res.status(503).json({ status: 'error', redis: 'unreachable' });
  }
});

module.exports = app;