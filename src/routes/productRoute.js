import express from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import {
  createOrUpdateProduct,
  getProducts,
  searchProductByBarcode,
  createCategory,
  getCategories
} from '../controllers/productController.js';

const router = express.Router();


// All routes protected by Clerk
router.use(ClerkExpressRequireAuth({}));

router.post('/product', createOrUpdateProduct);
router.get('/products', getProducts);
router.get('/product/search', searchProductByBarcode);
router.post('/category', createCategory);
router.get('/categories', getCategories);

export default router;