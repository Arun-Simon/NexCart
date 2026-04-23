'use strict';

require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');

const { connectDB, pool }   = require('./db');
const { startConsumer }     = require('./consumer');
const notificationsRoutes   = require('./routes/notifications');

const app  = express();
const PORT = process.env.PORT || 3004;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'notifications', uptime: process.uptime() } })
);

app.use('/notifications', notificationsRoutes);

app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[notifications-service] error:', err);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' });
});

const start = async () => {
  await connectDB();
  // Start RabbitMQ consumer (non-blocking if MQ unavailable at startup)
  startConsumer().catch((err) =>
    console.warn('[notifications-service] RabbitMQ consumer failed to start:', err.message)
  );
  app.listen(PORT, () => console.log(`[notifications-service] Listening on port ${PORT}`));
};

const shutdown = async (signal) => {
  console.log(`[notifications-service] ${signal} — shutting down`);
  await pool.end();
  process.exit(0);
};
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((err) => { console.error('[notifications-service] startup error:', err); process.exit(1); });
