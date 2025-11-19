// backend/controllers/productController.js

import { sql } from '../lib/db.js'; // adjust path if needed

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
      reorder_level = 10,
      image = null
    } = req.body;

    const clerk_id = req.auth?.userId; // Clerk middleware gives this

    // Validation
    if (!clerk_id) return res.status(401).json({ message: "Unauthorized" });
    if (!barcode || !name || !selling_price || !category_id) {
      return res.status(400).json({ message: "barcode, name, selling_price, and category_id are required" });
    }

    const result = await sql`
      INSERT INTO products (
        barcode, name, category_id, unit_type,
        purchase_cost, selling_price, current_stock,
        reorder_level, image, clerk_id
      ) VALUES (
        ${barcode}, ${name}, ${category_id}, ${unit_type},
        ${purchase_cost}, ${selling_price}, ${current_stock},
        ${reorder_level}, ${image}, ${clerk_id}
      )
      ON CONFLICT (barcode) DO UPDATE SET
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id,
        unit_type = EXCLUDED.unit_type,
        purchase_cost = EXCLUDED.purchase_cost,
        selling_price = EXCLUDED.selling_price,
        current_stock = EXCLUDED.current_stock,
        reorder_level = EXCLUDED.reorder_level,
        image = EXCLUDED.image,
        updated_at = NOW()
      RETURNING product_id, name, barcode, selling_price, image, current_stock, category_id
    `;

    res.status(201).json({
      message: "Product saved successfully",
      product: result[0]
    });

  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// 2. Get all products
export async function getProducts(req, res) {
  try {
    const clerk_id = req.auth?.userId;
    if (!clerk_id) return res.status(401).json({ message: "Unauthorized" });

    const products = await sql`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.clerk_id = ${clerk_id} AND p.is_active = true
      ORDER BY p.created_at DESC
    `;

    res.status(200).json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// 3. Search by barcode (for POS)
export async function searchProductByBarcode(req, res) {
  try {
    const { barcode } = req.query;
    const clerk_id = req.auth?.userId;

    if (!clerk_id) return res.status(401).json({ message: "Unauthorized" });
    if (!barcode) return res.status(400).json({ message: "Barcode is required" });

    const product = await sql`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.barcode = ${barcode} 
        AND p.clerk_id = ${clerk_id} 
        AND p.is_active = true
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
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Category name required" });

    const result = await sql`
      INSERT INTO categories (name)
      VALUES (${name.trim()})
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name
    `;

    if (result.length === 0) {
      // Already exists
      const existing = await sql`SELECT id, name FROM categories WHERE name = ${name.trim()}`;
      return res.status(200).json({ message: "Category already exists", category: existing[0] });
    }

    res.status(201).json({ message: "Category created", category: result[0] });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// 5. Get all categories
export async function getCategories(req, res) {
  try {
    const categories = await sql`SELECT id, name FROM categories ORDER BY name ASC`;
    res.status(200).json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}