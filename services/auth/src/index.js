'use strict';

require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');

const { connectDB, pool } = require('./db');
const authRoutes           = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'auth', uptime: process.uptime() } })
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[auth] unhandled error:', err);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' });
});

// ─── Startup ──────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`[auth-service] Listening on port ${PORT}`));
};

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`[auth-service] ${signal} — shutting down`);
  await pool.end();
  process.exit(0);
};
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((err) => { console.error('[auth-service] startup error:', err); process.exit(1); });
