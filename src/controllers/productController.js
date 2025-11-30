// backend/controllers/productController.js
import { sql } from "../config/db.js";

/* =========================
   GET ALL CATEGORIES
   GET /api/products/categories
========================= */
export const getCategories = async (req, res) => {
  try {
    const categories = await sql`
      SELECT category_id, name, created_at
      FROM categories
      ORDER BY created_at DESC
    `;

    res.status(200).json({ categories });   // ← wrapped
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   CREATE CATEGORY
   POST /api/products/categories
========================= */
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Optional duplicate check
    const existing = await sql`
      SELECT id
      FROM categories
      WHERE LOWER(name) = LOWER(${name})
    `;

    if (existing.length > 0) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const newCategory = await sql`
      INSERT INTO categories (name)
      VALUES (${name})
      RETURNING *
    `;

    res.status(201).json(newCategory[0]);

  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   DELETE CATEGORY
   DELETE /api/products/categories/:id
========================= */
export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const deleted = await sql`
      DELETE FROM categories
      WHERE category_id = ${categoryId}
      RETURNING *
    `;

    if (deleted.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });

  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   GET PRODUCTS BY CATEGORY + USER
   GET /api/products/category/:categoryId/:userId
========================= */
export const getProductsByCategory = async (req, res) => {
  try {
    const { userId, categoryId } = req.params;
    console.log("Params:", { userId, categoryId });

    const products = await sql`
      SELECT p.*, c.name as category_name
      FROM products p
      INNER JOIN categories c ON p.category_id = c.category_id
      WHERE p.category_id =${categoryId}
        AND p.user_id = ${userId}
      ORDER BY p.created_at DESC
    `;

    console.log("DB returned products:", products);

    res.status(200).json({ products });
  } catch (error) {
    console.error("Get products by category error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================
   CREATE PRODUCT
   POST /api/products
========================= */
export const createProduct = async (req, res) => {
  // 1. Get userId from URL parameters
  const { userId } = req.params; 

  if (!userId) {
    // This check is slightly redundant if your route is configured correctly (e.g., /users/:userId/products)
    return res.status(400).json({ message: "Missing userId in route parameters" });
  }

  try {
    // 2. ONLY destructure product details from req.body
    const {
      barcode,
      name,
      category_id,
      unit_type,
      purchase_cost,
      selling_price,
      current_stock,
      image,
      // *** Removed userId from req.body destructuring ***
    } = req.body;

    // 3. Validate required fields from the body
    if (!name || !category_id || !selling_price) {
      return res.status(400).json({ message: "Missing required fields (name, category_id, or selling_price)" });
    }

    // 4. Execute the SQL query using the userId from req.params
    const newProduct = await sql`
      INSERT INTO products
        (barcode, name, category_id, unit_type, purchase_cost, selling_price, current_stock, image, user_id)
      VALUES
        (${barcode}, ${name}, ${category_id}, ${unit_type}, ${purchase_cost}, ${selling_price}, ${current_stock}, ${image}, ${userId})
      RETURNING *
    `;

    res.status(201).json(newProduct[0]);

  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ message: "Server error" });
  }
};