const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { connectDB } = require('./db');
const productsRoutes = require('./routes/products.routes');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'products', timestamp: new Date() });
});

// Use the routes without prefix so /products and /categories match directly, 
// or prefix with '/' since routes define '/products' internally.
app.use('/', productsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('[products] unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Products Service listening on port ${PORT}`);
  });
};

start();
