const express = require('express');
const { body, param, validationResult } = require('express-validator');
const productsController = require('../controllers/products.controller');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.get('/categories', productsController.getCategories);

router.get('/products', productsController.getProducts);

router.get('/products/:id', [
  param('id').isUUID().withMessage('Invalid product ID format'),
  validate
], productsController.getProduct);

router.post('/products', [
  body('name').notEmpty().withMessage('Name is required'),
  body('price').isNumeric().withMessage('Price must be numeric'),
  validate
], productsController.createProduct);

router.put('/products/:id', [
  param('id').isUUID().withMessage('Invalid product ID format'),
  validate
], productsController.updateProduct);

router.patch('/products/:id/stock', [
  param('id').isUUID().withMessage('Invalid product ID format'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be positive integer'),
  validate
], productsController.updateStock);

module.exports = router;
