'use strict';

require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');

const { connectDB, pool } = require('./db');
const { seedProducts }    = require('./seed');
const productsRoutes       = require('./routes/products');
const categoriesRoutes     = require('./routes/categories');

const app  = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'products', uptime: process.uptime() } })
);

app.use('/products',   productsRoutes);
app.use('/categories', categoriesRoutes);

app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[products-service] error:', err);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' });
});

const start = async () => {
  await connectDB();
  await seedProducts();
  app.listen(PORT, () => console.log(`[products-service] Listening on port ${PORT}`));
};

const shutdown = async (signal) => {
  console.log(`[products-service] ${signal} — shutting down`);
  await pool.end();
  process.exit(0);
};
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((err) => { console.error('[products-service] startup error:', err); process.exit(1); });
