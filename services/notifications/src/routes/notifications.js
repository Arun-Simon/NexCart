'use strict';

const express = require('express');
const { param, validationResult } = require('express-validator');
const { pool } = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

// All notification routes require auth
router.use(verifyToken);

// ─── GET /notifications ───────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, type, title, body, is_read, metadata, created_at
       FROM notifications.notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    const unreadCount = rows.filter((n) => !n.is_read).length;
    return res.json({ success: true, data: { notifications: rows, unreadCount } });
  } catch (err) {
    console.error('[notifications] list error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// ─── PATCH /notifications/:id/read ───────────────────────────────────────────
router.patch('/:id/read', param('id').isUUID(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, error: 'Invalid notification ID' });
  }

  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE notifications.notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id, is_read`,
      [req.params.id, req.user.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[notifications] mark-read error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});

// ─── PATCH /notifications/read-all ───────────────────────────────────────────
router.patch('/read-all', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `UPDATE notifications.notifications
       SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );
    return res.json({ success: true, data: { updated: rowCount } });
  } catch (err) {
    console.error('[notifications] read-all error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to mark all as read' });
  }
});

module.exports = router;
