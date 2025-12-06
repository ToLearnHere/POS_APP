// routes/productRoute.js
import express from "express";
import {
  getCategories,
  createCategory,
  deleteCategory,
  getProductsByCategory,
  createProduct,
  getProductByBarcode,
    
} from "../controllers/productController.js";

const router = express.Router();


router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.delete("/categories/:categoryId", deleteCategory);
router.get("/category/:userId/:categoryId", getProductsByCategory);
router.post("/:userId", createProduct);
router.get("/:userId/:barcode", getProductByBarcode);

export default router;