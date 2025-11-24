import express from 'express';
import {
  createOrUpdateProduct,
  getProducts,
  searchProductByBarcode,
  createCategory,
  getCategories,
  getProductsByCategory,
} from '../controllers/productController.js';

const router = express.Router();

// Utility function to wrap async controllers
const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);

    if (!res.headersSent) {
      console.warn('Handler did not send a response, sending default 500');
      res.status(500).json({ message: "Handler did not send a response" });
    }

  } catch (error) {
    console.error('Route handler error:', error);
    console.error('Error stack:', error.stack);

    if (!res.headersSent) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  }
};

// =================================================================
// 🧾 REQUEST LOGGING ONLY — NO MORE DOUBLE RATE LIMIT
// =================================================================
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Request body:', JSON.stringify(req.body));
  console.log('Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  next();
});

// =================================================================
// ✅ PRODUCT ROUTES (Base URL = /api/products)
// =================================================================

router.get('/', asyncHandler(getProducts));
router.post('/', asyncHandler(createOrUpdateProduct));
router.get('/category/:userId', asyncHandler(getProductsByCategory));
router.get('/search', asyncHandler(searchProductByBarcode));

// =================================================================
// ✅ CATEGORY ROUTES
// =================================================================

router.post('/category', asyncHandler(createCategory));
router.get('/categories', asyncHandler(getCategories));

// =================================================================
// ✅ TEST ROUTE
// =================================================================
router.get('/test', (req, res) => {
  res.json({ 
    message: '✅ Product route working', 
    auth: req.auth || 'Not Authenticated', 
    timestamp: new Date().toISOString() 
  });
});

export default router;
