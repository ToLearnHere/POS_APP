import express from 'express';
import {
   createOrUpdateProduct,
   getProducts,
   searchProductByBarcode,
   createCategory,
   getCategories
} from '../controllers/productController.js';
import rateLimiter from '../middleware/rateLimiter.js';

const router = express.Router();

// Utility function to wrap async controllers and handle errors centrally
const asyncHandler = (fn) => async (req, res, next) => {
 try {
  await fn(req, res, next);
  // Ensure a response was sent. If not, this is likely an issue.
  if (!res.headersSent) {
   console.warn('Handler did not send a response, sending default 500');
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

// =================================================================
// 🛡️ MIDDLEWARE APPLICATION (Must come BEFORE route definitions)
// =================================================================

// 1. Request logging middleware (Keep this first)
router.use((req, res, next) => {
 console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
 console.log('Request body:', JSON.stringify(req.body));
 console.log('Request headers authorization:', req.headers.authorization ? 'Present' : 'Missing');
 next();
});

// 3. Apply rate limiter middleware to all routes (Runs after auth, uses req.auth.userId)
router.use(rateLimiter); 

// =================================================================
// 🚀 ROUTE DEFINITIONS
// =================================================================

// Product endpoints
// Note: We are using the createOrUpdateProduct controller which already
// handles the 401 Unauthorized check internally using req.auth?.userId.
router.post('/products', asyncHandler(createOrUpdateProduct));
router.get('/products/:userId', asyncHandler(getProducts));
router.get('/product/search', asyncHandler(searchProductByBarcode));

// Category endpoints
router.post('/category', asyncHandler(createCategory));
router.post('/categories', asyncHandler(createCategory)); 
router.get('/categories/', asyncHandler(getCategories));

// Test endpoint (can be helpful for health checks)
router.get('/test', (req, res) => {
 res.json({ 
    message: 'Test endpoint working', 
    auth: req.auth || 'Not Authenticated', 
    timestamp: new Date().toISOString() 
});
});


export default router;