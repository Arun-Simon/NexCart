'use strict';

require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');

const { connectDB, pool } = require('./db');
const { connectRabbitMQ } = require('./rabbitmq');
const ordersRoutes         = require('./routes/orders');

const app  = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'orders', uptime: process.uptime() } })
);

app.use('/', ordersRoutes);

app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[orders-service] error:', err);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' });
});

const start = async () => {
  await connectDB();
  // RabbitMQ connection is non-blocking — orders still work if MQ is unavailable
  connectRabbitMQ().catch((err) =>
    console.warn('[orders-service] RabbitMQ unavailable at startup:', err.message)
  );
  app.listen(PORT, () => console.log(`[orders-service] Listening on port ${PORT}`));
};

const shutdown = async (signal) => {
  console.log(`[orders-service] ${signal} — shutting down`);
  await pool.end();
  process.exit(0);
};
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((err) => { console.error('[orders-service] startup error:', err); process.exit(1); });
