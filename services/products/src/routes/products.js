'use strict';

const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { pool } = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/verifyToken');

const router = express.Router();

// ─── GET /products — paginated list ───────────────────────────────────────────
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('category').optional().isUUID(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, error: errors.array()[0].msg });

    const page  = req.query.page  || 1;
    const limit = req.query.limit || 12;
    const offset = (page - 1) * limit;
    const categoryId = req.query.category;

    try {
      const whereClause = categoryId
        ? 'WHERE p.is_active = TRUE AND p.category_id = $3'
        : 'WHERE p.is_active = TRUE';
      const params = categoryId ? [limit, offset, categoryId] : [limit, offset];

      const { rows } = await pool.query(
        `SELECT p.id, p.name, p.description, p.price, p.image_url,
                c.id AS category_id, c.name AS category_name,
                COALESCE(i.quantity, 0) AS stock
         FROM products.products p
         LEFT JOIN products.categories c ON c.id = p.category_id
         LEFT JOIN products.inventory  i ON i.product_id = p.id
         ${whereClause}
         ORDER BY p.created_at DESC
         LIMIT $1 OFFSET $2`,
        params
      );

      const countParams = categoryId ? [categoryId] : [];
      const countWhere  = categoryId ? 'WHERE is_active = TRUE AND category_id = $1' : 'WHERE is_active = TRUE';
      const countRes = await pool.query(
        `SELECT COUNT(*) FROM products.products ${countWhere}`,
        countParams
      );
      const total = parseInt(countRes.rows[0].count, 10);

      return res.json({
        success: true,
        data: {
          products: rows,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
      });
    } catch (err) {
      console.error('[products] list error:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to fetch products' });
    }
  }
);

// ─── GET /products/:id ────────────────────────────────────────────────────────
router.get('/:id', param('id').isUUID(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, error: 'Invalid product ID' });

  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.image_url, p.is_active,
              c.id AS category_id, c.name AS category_name,
              COALESCE(i.quantity, 0) AS stock
       FROM products.products p
       LEFT JOIN products.categories c ON c.id = p.category_id
       LEFT JOIN products.inventory  i ON i.product_id = p.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Product not found' });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[products] get error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

// ─── POST /products — admin only ──────────────────────────────────────────────
router.post(
  '/',
  verifyToken, requireAdmin,
  [
    body('name').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('category_id').optional().isUUID(),
    body('stock').optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, error: errors.array()[0].msg });

    const { name, description, price, image_url, category_id, stock } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO products.products (name, description, price, image_url, category_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [name, description || null, price, image_url || null, category_id || null]
      );
      await client.query(
        `INSERT INTO products.inventory (product_id, quantity) VALUES ($1, $2)`,
        [rows[0].id, stock ?? 0]
      );
      await client.query('COMMIT');
      return res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[products] create error:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to create product' });
    } finally {
      client.release();
    }
  }
);

// ─── PUT /products/:id ────────────────────────────────────────────────────────
router.put('/:id', verifyToken, requireAdmin, param('id').isUUID(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, error: 'Invalid product ID' });

  const { name, description, price, image_url, category_id, is_active, stock } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE products.products
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           image_url = COALESCE($4, image_url),
           category_id = COALESCE($5, category_id),
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [name, description, price, image_url, category_id, is_active, req.params.id]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    if (stock !== undefined) {
      await client.query(
        `UPDATE products.inventory SET quantity = $1, updated_at = NOW() WHERE product_id = $2`,
        [stock, req.params.id]
      );
    }
    await client.query('COMMIT');
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[products] update error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to update product' });
  } finally {
    client.release();
  }
});

// ─── DELETE /products/:id ─────────────────────────────────────────────────────
router.delete('/:id', verifyToken, requireAdmin, param('id').isUUID(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, error: 'Invalid product ID' });

  try {
    const { rowCount } = await pool.query(
      `UPDATE products.products SET is_active = FALSE, updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ success: false, error: 'Product not found' });
    return res.json({ success: true, data: { message: 'Product deactivated' } });
  } catch (err) {
    console.error('[products] delete error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
});

module.exports = router;
