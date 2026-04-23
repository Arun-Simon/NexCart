'use strict';

const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME     || 'nexcart',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASS     || 'postgres',
  max:      10,
  idleTimeoutMillis:    30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => console.error('[orders-db] Pool error:', err.message));

const MAX_RETRIES = 10;
const RETRY_DELAY = 3000;

const connectDB = async (retries = 0) => {
  try {
    const client = await pool.connect();
    const { rows } = await client.query('SELECT NOW() AS now');
    client.release();
    console.log(`[orders-db] Connected to PostgreSQL at ${rows[0].now}`);
  } catch (err) {
    if (retries < MAX_RETRIES) {
      console.warn(`[orders-db] Database not ready — retry ${retries + 1}/${MAX_RETRIES}`);
      await new Promise(r => setTimeout(r, RETRY_DELAY));
      return connectDB(retries + 1);
    }
    console.error('[orders-db] Could not connect to PostgreSQL after max retries:', err.message);
    throw err;
  }
};

module.exports = { pool, connectDB };
