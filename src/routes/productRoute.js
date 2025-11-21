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
import rateLimiter from '../middleware/rateLimiter.js'; // <-- NEW IMPORT

const router = express.Router();

// Request logging middleware (Keep this first)
router.use((req, res, next) => {
  // ... (logging logic remains unchanged)
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Request body:', JSON.stringify(req.body));
  console.log('Request headers authorization:', req.headers.authorization ? 'Present' : 'Missing');
  next();
});

// Apply auth middleware to all routes (Must run before rateLimiter)
router.use(authMiddleware);

// Apply rate limiter middleware to all routes (Runs after auth, uses req.auth.userId)
router.use(rateLimiter); // <-- NEW: Apply Rate Limiter here

// Wrap controllers in error handler (asyncHandler remains the same)
const asyncHandler = (fn) => async (req, res, next) => {
  // ... (asyncHandler logic remains unchanged)
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

// ... (Test endpoints remain the same)
router.post('/category/test', (req, res) => {
  console.log('Test endpoint hit!');
  console.log('Request body:', req.body);
  res.json({ message: 'Test endpoint working', body: req.body, timestamp: new Date().toISOString() });
});

// Product endpoints
router.post('/product', asyncHandler(createOrUpdateProduct));
router.get('/products', asyncHandler(getProducts));
router.get('/product/search', asyncHandler(searchProductByBarcode));

// Category endpoints
router.post('/category', asyncHandler(createCategory));
router.post('/categories', asyncHandler(createCategory)); 
router.get('/categories', asyncHandler(getCategories));

export default router;