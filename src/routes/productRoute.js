// backend/routes/productRoutes.js

import express from "express";
import {
  getCategories,
  createCategory,
  deleteCategory,
  getProductByBarcode,
  getProductsByCategory,
  createProduct
} from "../controllers/productController.js";

const router = express.Router();

router.use((req, res, next) => {
  console.log("ANY REQUEST HIT THE ROUTER – TIME:", new Date().toISOString());
  next();
});
router.get("/debug-barcode-test", (req, res) => {
  console.log("DEBUG ROUTE HIT – YOUR DEPLOY IS FRESH!");
  res.json({ message: "Deploy is working!", time: new Date().toISOString() });
});
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

// MOVE THESE TWO LINES TO THE TOP of the products section (or at least above the /:userId POST)
router.get("/:userId/:barcode", getProductByBarcode);        // ← Must come BEFORE /:userId
router.post("/:userId", createProduct);                     // ← This one can stay below

// You can even make it clearer like this:
router.get("/:userId/barcode/:barcode", getProductByBarcode); // Optional – avoids conflict completely


export default router;