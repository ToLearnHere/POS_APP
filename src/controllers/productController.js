// backend/controllers/productController.js

import { sql } from '../config/db.js'; // adjust path if needed

// 1. Create / Update Product (same as your transaction style)
export async function createOrUpdateProduct(req, res) {
    try {
    const {
      barcode,
      name,
      category_id,
      unit_type = 'pcs',
      purchase_cost = 0,
      selling_price,
      current_stock = 0,
      image = null,
      userId,
    } = req.body;

    // Validation
    if (!userId) {
      console.log("No userId, sending 401 Unauthorized");
      const response = { message: "Unauthorized" };
      console.log("Sending 401 response:", JSON.stringify(response));
      return res.status(401).json(response);
    }

    if (!barcode || !name || !selling_price || !category_id) {
      console.log("Missing required fields");
      const response = { message: "barcode, name, selling_price, and category_id are required" };
      console.log("Sending 400 response:", JSON.stringify(response));
      return res.status(400).json(response);
    }

    // console.log("Inserting/updating product for userId:", userId);
    const result = await sql`
      INSERT INTO products (
        barcode, name, category_id, unit_type,
        purchase_cost, selling_price, current_stock,
        image, user_id
      ) VALUES (
        ${barcode}, ${name}, ${category_id}, ${unit_type},
        ${purchase_cost}, ${selling_price}, ${current_stock},
        ${image}, ${userId}
      )
      ON CONFLICT (barcode) DO UPDATE SET
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id,
        unit_type = EXCLUDED.unit_type,
        purchase_cost = EXCLUDED.purchase_cost,
        selling_price = EXCLUDED.selling_price,
        current_stock = EXCLUDED.current_stock,
        image = EXCLUDED.image,
        updated_at = NOW()
      RETURNING product_id, name, barcode, selling_price, image, current_stock, category_id
    `;
    const response = {
      message: "Product saved successfully",
      product: result[0]
    };
    console.log("Sending 201 response:", JSON.stringify(response));
    res.status(201).json(response);
    console.log("=== createOrUpdateProduct SUCCESS ===");

  } catch (error) {
    console.error("Error saving product:", error);
    console.error("Error stack:", error.stack);
    if (!res.headersSent) {
      const errorResponse = { message: "Internal server error", error: error.message };
      console.log("Sending 500 error response:", JSON.stringify(errorResponse));
      res.status(500).json(errorResponse);
    }
    console.log("=== createOrUpdateProduct END (ERROR) ===");
  }
}

// 2. Get all products

export async function getProducts(req, res) {
  try {
    const userId = req.query.userId;
    if (!userId) {
      const response = { message: "Unauthorized" };
      console.log("Sending 401 response:", JSON.stringify(response));
      return res.status(401).json(response);
    }

    const products = await sql`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.user_id = ${userId} AND p.is_active = true
      ORDER BY p.created_at DESC
    `;

    console.log("Products found:", products.length);
    const response = { products };
    console.log("Sending products response with", products.length, "products");
    res.status(200).json(response);
    console.log("=== getProducts SUCCESS ===");
  } catch (error) {
    console.error("=== getProducts ERROR ===");
    console.error("CRASH in getProducts:", error);
    console.error("Error stack:", error.stack);
    if (!res.headersSent) {
      const errorResponse = { message: "Server error", error: error.message };
      console.log("Sending 500 error response:", JSON.stringify(errorResponse));
      res.status(500).json(errorResponse);
    }
    console.log("=== getProducts END (ERROR) ===");
  }
}
export async function getProductsByCategory(req, res) {
  try {
    const { userId: user_id } = req.params;
    const { category } = req.query; // ← NEW: get category from query params

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Build dynamic WHERE conditions
    let query = sql`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.quantity,
        p.image_url,
        p.category_id,
        p.created_at,
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.user_id = ${user_id}
        AND p.is_active = true
    `;

    // Add category filter if provided
    if (category && category !== "" && category !== "null") {
      query = sql`
        ${query}
        AND p.category_id = ${category}
      `;
    }

    query = sql`
      ${query}
      ORDER BY p.created_at DESC
    `;

    const products = await query;

    console.log(`Products found: ${products.length} (category: ${category || "All"})`);

    res.status(200).json({ products });
  } catch (error) {
    console.error("getProducts ERROR:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  }
}

// 3. Search by barcode (for POS)
export async function searchProductByBarcode(req, res) {
  try {
    const { barcode } = req.query;
    const userId = req.auth?.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!barcode) return res.status(400).json({ message: "Barcode is required" });

    const product = await sql`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.barcode = ${barcode} AND p.user_id = ${userId}
      LIMIT 1
    `;

    if (!product[0]) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ product: product[0] });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// 4. Add new category
export async function createCategory(req, res) {
  console.log("=== createCategory START ===");
  console.log("Request method:", req.method);
  console.log("Request path:", req.path);
  console.log("Request body:", JSON.stringify(req.body));
  console.log("req.auth:", req.auth);
  
  // Set response headers early
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      console.log("Category name missing or empty");
      const errorResponse = { message: "Category name required" };
      console.log("Sending 400 response:", JSON.stringify(errorResponse));
      return res.status(400).json(errorResponse);
    }

    console.log("Inserting category:", name.trim());
    const result = await sql`
      INSERT INTO categories (name)
      VALUES (${name.trim()})
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name
    `;

    console.log("Insert result:", result);

    if (result.length === 0) {
      // Already exists
      console.log("Category already exists, fetching existing");
      const existing = await sql`SELECT id, name FROM categories WHERE name = ${name.trim()}`;
      console.log("Existing category:", existing);
      const response = { message: "Category already exists", category: existing[0] };
      console.log("Sending 200 response:", JSON.stringify(response));
      return res.status(200).json(response);
    }

    console.log("Category created successfully:", result[0]);
    const response = { message: "Category created", category: result[0] };
    console.log("Sending 201 response:", JSON.stringify(response));
    
    // Ensure response is sent
    if (!res.headersSent) {
      res.status(201).json(response);
      console.log("Response sent successfully, headersSent:", res.headersSent);
    } else {
      console.error("ERROR: Headers already sent, cannot send response!");
    }
    console.log("=== createCategory SUCCESS ===");
  } catch (error) {
    console.error("=== createCategory ERROR ===");
    console.error("Error creating category:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    // Ensure we always send a response
    if (!res.headersSent) {
      const errorResponse = { message: "Internal server error", error: error.message };
      console.log("Sending 500 error response:", JSON.stringify(errorResponse));
      res.status(500).json(errorResponse);
    } else {
      console.error("ERROR: Cannot send error response, headers already sent!");
    }
    console.log("=== createCategory END (ERROR) ===");
  }
}

export async function getCategories(req, res) {
  try {
    const categories = await sql `SELECT * FROM categories ORDER BY name ASC`;

    console.log("Categories found:", categories.length);
    const response = { categories };
    res.status(200).json(response);
  } catch (error) {
    console.error("CRASH in getCategories:", error);
    console.error("Error stack:", error.stack);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
}