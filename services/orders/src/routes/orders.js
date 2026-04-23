'use strict';

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { pool } = require('../db');
const { verifyToken } = require('../middleware/verifyToken');
const { publish } = require('../rabbitmq');

const router = express.Router();

// All cart + order routes require auth
router.use(verifyToken);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get or create a cart for the current user.
 * Returns the cart row.
 */
const getOrCreateCart = async (userId, client) => {
  const db = client || pool;
  let { rows } = await db.query(
    'SELECT id FROM orders.cart WHERE user_id = $1',
    [userId]
  );
  if (rows.length === 0) {
    const ins = await db.query(
      'INSERT INTO orders.cart (user_id) VALUES ($1) RETURNING id',
      [userId]
    );
    return ins.rows[0];
  }
  return rows[0];
};

// ─── GET /cart ────────────────────────────────────────────────────────────────
router.get('/cart', async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    const { rows } = await pool.query(
      `SELECT ci.id, ci.product_id, ci.product_name, ci.price, ci.quantity,
              (ci.price * ci.quantity) AS subtotal
       FROM orders.cart_items ci
       WHERE ci.cart_id = $1
       ORDER BY ci.created_at ASC`,
      [cart.id]
    );
    const total = rows.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    return res.json({ success: true, data: { cart_id: cart.id, items: rows, total: total.toFixed(2) } });
  } catch (err) {
    console.error('[orders] cart get error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch cart' });
  }
});

// ─── POST /cart/items ─────────────────────────────────────────────────────────
router.post(
  '/cart/items',
  [
    body('product_id').isUUID(),
    body('product_name').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('quantity').optional().isInt({ min: 1 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, error: errors.array()[0].msg });

    const { product_id, product_name, price, quantity = 1 } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const cart = await getOrCreateCart(req.user.id, client);

      // Upsert — if already in cart increase qty
      const { rows } = await client.query(
        `INSERT INTO orders.cart_items (cart_id, product_id, product_name, price, quantity)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (cart_id, product_id)
         DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity,
                       updated_at = NOW()
         RETURNING *`,
        [cart.id, product_id, product_name, price, quantity]
      );
      await client.query('UPDATE orders.cart SET updated_at = NOW() WHERE id = $1', [cart.id]);
      await client.query('COMMIT');
      return res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[orders] add-to-cart error:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to add item to cart' });
    } finally {
      client.release();
    }
  }
);

// ─── DELETE /cart/items/:id ───────────────────────────────────────────────────
router.delete('/cart/items/:id', param('id').isUUID(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, error: 'Invalid item ID' });

  try {
    const cart = await getOrCreateCart(req.user.id);
    const { rowCount } = await pool.query(
      `DELETE FROM orders.cart_items WHERE id = $1 AND cart_id = $2`,
      [req.params.id, cart.id]
    );
    if (rowCount === 0) return res.status(404).json({ success: false, error: 'Cart item not found' });
    return res.json({ success: true, data: { message: 'Item removed from cart' } });
  } catch (err) {
    console.error('[orders] remove cart item error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to remove cart item' });
  }
});

// ─── POST /orders — checkout ──────────────────────────────────────────────────
router.post('/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cart = await getOrCreateCart(req.user.id, client);
    const { rows: items } = await client.query(
      'SELECT * FROM orders.cart_items WHERE cart_id = $1',
      [cart.id]
    );

    if (items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    const totalAmount = items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);

    const orderRes = await client.query(
      `INSERT INTO orders.orders (user_id, total_amount)
       VALUES ($1, $2) RETURNING *`,
      [req.user.id, totalAmount.toFixed(2)]
    );
    const order = orderRes.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO orders.order_items (order_id, product_id, product_name, price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.product_id, item.product_name, item.price, item.quantity]
      );
    }

    // Clear cart
    await client.query('DELETE FROM orders.cart_items WHERE cart_id = $1', [cart.id]);
    await client.query('COMMIT');

    // Publish event to RabbitMQ
    await publish('order.placed', {
      orderId:  order.id,
      userId:   req.user.id,
      total:    totalAmount.toFixed(2),
      items:    items.map((i) => ({ productId: i.product_id, name: i.product_name, qty: i.quantity })),
      placedAt: order.created_at,
    });

    return res.status(201).json({ success: true, data: order });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[orders] place order error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to place order' });
  } finally {
    client.release();
  }
});

// ─── GET /orders ──────────────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.status, o.total_amount, o.created_at,
              json_agg(json_build_object(
                'id', oi.id, 'product_id', oi.product_id,
                'product_name', oi.product_name, 'price', oi.price, 'quantity', oi.quantity
              ) ORDER BY oi.product_name) AS items
       FROM orders.orders o
       LEFT JOIN orders.order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[orders] list orders error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// ─── GET /orders/:id ──────────────────────────────────────────────────────────
router.get('/orders/:id', param('id').isUUID(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, error: 'Invalid order ID' });

  try {
    const orderRes = await pool.query(
      'SELECT * FROM orders.orders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const itemsRes = await pool.query(
      'SELECT * FROM orders.order_items WHERE order_id = $1',
      [req.params.id]
    );
    return res.json({ success: true, data: { ...orderRes.rows[0], items: itemsRes.rows } });
  } catch (err) {
    console.error('[orders] get order error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

module.exports = router;
