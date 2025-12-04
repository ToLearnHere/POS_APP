// backend/routes/productRoutes.js
import express from "express";
import {
  // CATEGORIES
  getCategories,
  createCategory,
  deleteCategory,

  // PRODUCTS
  getProductByBarcode,
  getProductsByCategory,
  createProduct
} from "../controllers/productController.js";

const router = express.Router();

/* =========================
   CATEGORIES
========================= */
// GET all categories
router.get("/categories", getCategories);

// CREATE new category

router.post("/categories", createCategory);

// DELETE category
router.delete("/categories/:id", deleteCategory);

/* =========================
   PRODUCTS
========================= */
router.get("/category/:userId/:categoryId", getProductsByCategory);
// CREATE product
// /api/products
router.post("/:userId", createProduct);

// ADD THIS NEW ROUTE
router.get("/barcode/:userId/:barcode", getProductByBarcode);


export default router;
