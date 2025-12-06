// backend/routes/productRoutes.js

import express from "express";
import {
  getCategories,
  createCategory,
  deleteCategory,
  getProductByBarcode,
  getProductsByCategory,
  createProduct,
  searchProductsByName,
} from "../controllers/productController.js";

const router = express.Router();

/* =========================
   CATEGORIES
========================= */
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.delete("/categories/:id", deleteCategory);

/* =========================
   PRODUCTS
========================= */
router.get("/category/:userId/:categoryId", getProductsByCategory);
// Add this line with your other product routes


router.get("/search/:userId", searchProductsByName);



router.get("/:userId/:barcode", getProductByBarcode);     




router.post("/:userId", createProduct);                     



export default router;