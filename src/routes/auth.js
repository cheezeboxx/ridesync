const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const router = express.Router();
const SALT_ROUNDS = 10;

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || password.length < 8) {
    return res
      .status(400)
      .json({ error: 'Valid email and password (min 8 chars) required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, role, created_at`,
      [email.toLowerCase(), passwordHash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if(err.code === '23505') {
        res.status(409).json({ error: 'Email already registered' });
    }
    else {
        console.error('Register failed:', err);
        res.status(500).json({ error: 'Something went wrong' });
    }
  }
});

module.exports = router;