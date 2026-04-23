'use strict';

const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// ─── GET /categories ──────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.description,
              COUNT(p.id)::int AS product_count
       FROM products.categories c
       LEFT JOIN products.products p
         ON p.category_id = c.id AND p.is_active = TRUE
       GROUP BY c.id
       ORDER BY c.name`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[categories] list error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

module.exports = router;
