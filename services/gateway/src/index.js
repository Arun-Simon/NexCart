'use strict';

require('dotenv').config();
const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app  = express();
const PORT = process.env.PORT || 3000;

const AUTH_URL          = process.env.AUTH_URL          || 'http://localhost:3001';
const PRODUCTS_URL      = process.env.PRODUCTS_URL      || 'http://localhost:3002';
const ORDERS_URL        = process.env.ORDERS_URL        || 'http://localhost:3003';
const NOTIFICATIONS_URL = process.env.NOTIFICATIONS_URL || 'http://localhost:3004';

// ─── Security & CORS ──────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('combined'));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests — please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many auth attempts — please try again later' },
});

app.use(globalLimiter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'gateway', uptime: process.uptime() } })
);

// ─── Proxy helpers ────────────────────────────────────────────────────────────
const makeProxy = (target, pathRewrite) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    on: {
      error: (err, _req, res) => {
        console.error(`[gateway] proxy error → ${target}:`, err.message);
        if (!res.headersSent) {
          res.status(502).json({ success: false, error: `Upstream service unavailable` });
        }
      },
    },
  });

// ─── Route Proxies ────────────────────────────────────────────────────────────

// Auth  →  /auth/* → Auth Service (keep /auth prefix)
app.use('/auth', authLimiter, makeProxy(AUTH_URL));

// Products + Categories  →  Products Service
app.use('/products',   makeProxy(PRODUCTS_URL));
app.use('/categories', makeProxy(PRODUCTS_URL));

// Cart + Orders  →  Orders Service
app.use('/cart',   makeProxy(ORDERS_URL));
app.use('/orders', makeProxy(ORDERS_URL));

// Notifications  →  Notifications Service
app.use('/notifications', makeProxy(NOTIFICATIONS_URL));

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Gateway: route not found' }));

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[gateway] API Gateway listening on port ${PORT}`);
  console.log(`  /auth           → ${AUTH_URL}`);
  console.log(`  /products       → ${PRODUCTS_URL}`);
  console.log(`  /categories     → ${PRODUCTS_URL}`);
  console.log(`  /cart + /orders → ${ORDERS_URL}`);
  console.log(`  /notifications  → ${NOTIFICATIONS_URL}`);
});

process.on('SIGINT',  () => { console.log('[gateway] SIGINT — shutting down'); process.exit(0); });
process.on('SIGTERM', () => { console.log('[gateway] SIGTERM — shutting down'); process.exit(0); });
