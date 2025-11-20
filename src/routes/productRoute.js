// backend/src/routes/productRoute.js

import express from 'express';
import {
  createOrUpdateProduct,
  getProducts,
  searchProductByBarcode,
  createCategory,
  getCategories
} from '../controllers/productController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Request logging middleware
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Request body:', JSON.stringify(req.body));
  console.log('Request headers authorization:', req.headers.authorization ? 'Present' : 'Missing');
  next();
});

// Apply auth middleware to all routes
router.use(authMiddleware);

// Wrap controllers in error handler to ensure responses are always sent
const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
    // If the handler didn't send a response, send a default one
    if (!res.headersSent) {
      console.warn('Handler did not send a response, sending default');
      res.status(500).json({ message: "Handler did not send a response" });
    }
  } catch (error) {
    console.error('Route handler error:', error);
    console.error('Error stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    } else {
      console.error('Cannot send error response - headers already sent');
    }
  }
};

// Test endpoints for debugging
router.post('/category/test', (req, res) => {
  console.log('Test endpoint hit!');
  console.log('Request body:', req.body);
  res.json({ message: 'Test endpoint working', body: req.body, timestamp: new Date().toISOString() });
});

router.post('/category/simple', (req, res) => {
  console.log('Simple category endpoint hit!');
  console.log('Request body:', req.body);
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  res.status(201).json({ message: 'Category would be created', name: name });
});

router.post('/product', asyncHandler(createOrUpdateProduct));
router.get('/products', asyncHandler(getProducts));
router.get('/product/search', asyncHandler(searchProductByBarcode));
router.post('/category', asyncHandler(createCategory));
router.post('/categories', asyncHandler(createCategory)); // Allow both singular and plural
router.get('/categories', asyncHandler(getCategories));

export default router;