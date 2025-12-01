// backend/routes/productRoutes.js
import express from "express";
import {
  // CATEGORIES
  getCategories,
  createCategory,
  deleteCategory,

  // PRODUCTS
  getProductsByCategory,
  createProduct
} from "../controllers/productController.js";

const router = express.Router();

/* =========================
   CATEGORIES
========================= */

// GET all categories
// /api/products/categories
router.get("/categories", getCategories);

// CREATE new category
// /api/products/categories
router.post("/categories", createCategory);

// DELETE category
// /api/products/categories/:id
router.delete("/categories/:id", deleteCategory);


/* =========================
   PRODUCTS
========================= */

// GET products by category + user
// Correct route — matches what your frontend calls
// ✅ CORRECT: Matches your frontend URL exactly
// backend/routes/productRoutes.js  ← this file
router.get("/category/:userId/:categoryId", getProductsByCategory);
// CREATE product
// /api/products
router.post("/:userId", createProduct);

export default router;
