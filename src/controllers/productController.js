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
      SELECT category_id
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
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "Missing userId in URL" });
  }

  try {
    // Extract product fields safely
    const {
      barcode,
      name,
      category_id,
      unit_type = "pcs",
      purchase_cost = 0,
      selling_price,
      current_stock = 0,
      image,
    } = req.body;

    // console.log("➡️ PRODUCT PAYLOAD RECEIVED:", req.body);
    // console.log("➡️ USER ID FROM PARAMS:", userId);

    /* ======================================================
       VALIDATIONS (very clear & helpful messages)
    ====================================================== */

    if (!barcode || barcode.trim() === "") {
      return res.status(400).json({ message: "Barcode is required" });
    }

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Product name is required" });
    }

    // category_id must not be undefined/null
    if (category_id === undefined || category_id === null) {
      return res.status(400).json({ message: "Category is required" });
    }

    if (!selling_price) {
      return res.status(400).json({ message: "Selling price is required" });
    }

    /* ======================================================
       INSERT INTO DATABASE
    ====================================================== */

    try {
      const result = await sql`
        INSERT INTO products
          (barcode, name, category_id, unit_type, purchase_cost, selling_price, current_stock, image, user_id)
        VALUES
          (${barcode}, ${name}, ${category_id}, ${unit_type}, ${purchase_cost}, ${selling_price},
           ${current_stock}, ${image}, ${userId})
        RETURNING *
      `;

      console.log("✅ PRODUCT CREATED:", result[0]);
      return res.status(201).json(result[0]);
    }

    catch (dbError) {
      console.error("❌ DATABASE INSERT ERROR:", dbError);

      // Detect common Postgres errors
      if (dbError.code === "23505") {
        // unique violation (e.g., barcode already exists)
        return res.status(400).json({ message: "Barcode already exists" });
      }

      if (dbError.code === "23503") {
        // foreign key error
        return res.status(400).json({ message: "Invalid category_id" });
      }

      return res.status(500).json({ message: "Database error", detail: dbError.message });
    }

  } catch (error) {
    console.error("❌ SERVER ERROR:", error);
    return res.status(500).json({ message: "Server error", detail: error.message });
  }
};

/* =========================
   Get PRODUCT by Barcode
========================= */
// Server-side: In your getProductByBarcode controller

export const getProductByBarcode = async (req, res) => {
 const { barcode, userId } = req.params;

 console.log("User ID:", userId); // Still useful for verification
console.log("--- DEBUGGING ALL PRODUCTS ---");

  try {
    const result = await sql`
      SELECT product_id, barcode, user_id, is_active FROM products LIMIT 50
    `;

    console.log("All Product Data:", result);

    return res.status(200).json({ message: "DEBUG LOGGED" });
  } catch (err) {
    console.error("DB ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
