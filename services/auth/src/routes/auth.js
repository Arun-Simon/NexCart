'use strict';

const express   = require('express');
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const crypto    = require('crypto');
const { body, validationResult } = require('express-validator');
const { pool }  = require('../db');

const router = express.Router();

const JWT_SECRET          = process.env.JWT_SECRET          || 'nexcart_super_secret_change_in_prod';
const JWT_ACCESS_EXPIRES  = process.env.JWT_ACCESS_EXPIRES  || '15m';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';
const SALT_ROUNDS = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const signAccess = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES });

const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

// ─── POST /auth/register ──────────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, error: errors.array()[0].msg });
    }

    const { email, password, name, role } = req.body;

    try {
      // Check duplicate
      const existing = await pool.query('SELECT id FROM auth.users WHERE email = $1', [email]);
      if (existing.rowCount > 0) {
        return res.status(409).json({ success: false, error: 'Email already registered' });
      }

      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      const safeRole = role === 'admin' ? 'admin' : 'customer';

      const { rows } = await pool.query(
        `INSERT INTO auth.users (email, password, name, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, name, role, created_at`,
        [email, hash, name, safeRole]
      );

      return res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      console.error('[auth] register error:', err.message);
      return res.status(500).json({ success: false, error: 'Registration failed' });
    }
  }
);

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, error: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    try {
      const { rows } = await pool.query(
        'SELECT id, email, name, role, password FROM auth.users WHERE email = $1',
        [email]
      );
      if (rows.length === 0) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const user = rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      // Create session
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const sessionRes = await pool.query(
        `INSERT INTO auth.sessions (user_id, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [user.id, req.ip, req.headers['user-agent'] || '', expiresAt]
      );
      const sessionId = sessionRes.rows[0].id;

      // Create refresh token
      const rawRefresh = crypto.randomBytes(64).toString('hex');
      const tokenHash  = hashToken(rawRefresh);
      await pool.query(
        `INSERT INTO auth.refresh_tokens (user_id, session_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [user.id, sessionId, tokenHash, expiresAt]
      );

      const accessToken = signAccess(user);

      return res.json({
        success: true,
        data: {
          accessToken,
          refreshToken: rawRefresh,
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
        },
      });
    } catch (err) {
      console.error('[auth] login error:', err.message);
      return res.status(500).json({ success: false, error: 'Login failed' });
    }
  }
);

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ success: false, error: 'refreshToken required' });
  }

  const tokenHash = hashToken(refreshToken);

  try {
    const { rows } = await pool.query(
      `SELECT rt.id, rt.user_id, rt.expires_at, rt.is_revoked,
              u.email, u.name, u.role
       FROM auth.refresh_tokens rt
       JOIN auth.users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1`,
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    const rt = rows[0];
    if (rt.is_revoked || new Date(rt.expires_at) < new Date()) {
      return res.status(401).json({ success: false, error: 'Refresh token expired or revoked' });
    }

    const accessToken = signAccess({ id: rt.user_id, email: rt.email, role: rt.role });
    return res.json({ success: true, data: { accessToken } });
  } catch (err) {
    console.error('[auth] refresh error:', err.message);
    return res.status(500).json({ success: false, error: 'Token refresh failed' });
  }
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ success: false, error: 'refreshToken required' });
  }

  const tokenHash = hashToken(refreshToken);

  try {
    await pool.query(
      `UPDATE auth.refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1`,
      [tokenHash]
    );
    // Deactivate session
    await pool.query(
      `UPDATE auth.sessions s
       SET is_active = FALSE
       FROM auth.refresh_tokens rt
       WHERE rt.token_hash = $1 AND rt.session_id = s.id`,
      [tokenHash]
    );
    return res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (err) {
    console.error('[auth] logout error:', err.message);
    return res.status(500).json({ success: false, error: 'Logout failed' });
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
const { verifyToken } = require('../middleware/verifyToken');

router.get('/me', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, role, created_at FROM auth.users WHERE id = $1',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[auth] me error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

module.exports = router;
