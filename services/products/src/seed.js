'use strict';

const { pool } = require('../db');

// ─── Seed data ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Electronics',    description: 'Gadgets, devices and tech accessories' },
  { name: 'Clothing',       description: 'Apparel for every occasion' },
  { name: 'Books',          description: 'Fiction, non-fiction and educational books' },
  { name: 'Home & Kitchen', description: 'Everything for your home' },
  { name: 'Sports',         description: 'Equipment and apparel for sports' },
];

const PRODUCTS = [
  { name: 'Wireless Noise-Cancelling Headphones', category: 'Electronics', price: 249.99, description: 'Premium over-ear headphones with 40h battery life and ANC.' },
  { name: 'Mechanical Keyboard', category: 'Electronics', price: 129.95, description: 'TKL layout, RGB backlit, Cherry MX switches.' },
  { name: '4K Ultra HD Monitor 27"', category: 'Electronics', price: 399.00, description: 'IPS panel, 144Hz, HDR400, USB-C.' },
  { name: 'Slim Fit Oxford Shirt', category: 'Clothing', price: 49.99, description: 'Premium cotton, wrinkle-resistant, available in 8 colours.' },
  { name: 'Running Sneakers Pro', category: 'Clothing', price: 89.95, description: 'Lightweight mesh upper, cushioned sole, breathable design.' },
  { name: 'Clean Code — Robert C. Martin', category: 'Books', price: 34.99, description: 'A handbook of agile software craftsmanship.' },
  { name: 'Atomic Habits — James Clear', category: 'Books', price: 27.50, description: 'An easy and proven way to build good habits.' },
  { name: 'Stainless Steel Water Bottle', category: 'Home & Kitchen', price: 24.99, description: 'Double-wall insulated, keeps drinks cold 24h.' },
  { name: 'Non-Stick Cookware Set (10 pcs)', category: 'Home & Kitchen', price: 139.00, description: 'Granite-coated, oven safe to 450°F.' },
  { name: 'Yoga Mat Premium', category: 'Sports', price: 59.95, description: 'Extra thick 6mm, non-slip surface, eco-friendly TPE.' },
];

/**
 * seedProducts — inserts categories and 10 sample products only if the products table is empty.
 */
const seedProducts = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const countRes = await client.query('SELECT COUNT(*) FROM products.products');
    if (parseInt(countRes.rows[0].count, 10) > 0) {
      console.log('[products] Seed skipped — products table already has data');
      await client.query('ROLLBACK');
      return;
    }

    // Insert categories and build name->id map
    const catMap = {};
    for (const cat of CATEGORIES) {
      const res = await client.query(
        `INSERT INTO products.categories (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
         RETURNING id, name`,
        [cat.name, cat.description]
      );
      catMap[res.rows[0].name] = res.rows[0].id;
    }

    // Insert products + inventory
    for (const p of PRODUCTS) {
      const categoryId = catMap[p.category];
      const imageSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const imageUrl = `https://source.unsplash.com/400x300/?${encodeURIComponent(p.category)},product`;

      const prodRes = await client.query(
        `INSERT INTO products.products (category_id, name, description, price, image_url)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [categoryId, p.name, p.description, p.price, imageUrl]
      );
      const productId = prodRes.rows[0].id;

      await client.query(
        `INSERT INTO products.inventory (product_id, quantity) VALUES ($1, $2)`,
        [productId, Math.floor(Math.random() * 100) + 10]
      );
    }

    await client.query('COMMIT');
    console.log(`[products] Seeded ${PRODUCTS.length} products and ${CATEGORIES.length} categories`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[products] Seed failed:', err.message);
  } finally {
    client.release();
  }
};

module.exports = { seedProducts };
