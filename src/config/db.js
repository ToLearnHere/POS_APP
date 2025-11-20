import { neon } from '@neondatabase/serverless';
import "dotenv/config";

// Create a SQL connection using our DB URL
export const sql = neon(process.env.DATABASE_URL);

// Initialize all tables (run once or on startup)
export async function initDB() {
    try {

        await sql`CREATE TABLE IF NOT EXISTS transactions(
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(255) NOT NULL,
        created_at DATE NOT NULL DEFAULT CURRENT_DATE
        )`;
        
        // 1. Categories
        await sql`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;

        // 2. Products — only stores clerk_id (from Clerk)
        await sql`
            CREATE TABLE IF NOT EXISTS products (
                product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                barcode VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
                unit_type VARCHAR(20) NOT NULL DEFAULT 'pcs' 
                    CHECK (unit_type IN ('pcs','pack','box','kg','g','L','mL','dozen')),
                purchase_cost DECIMAL(10,2) DEFAULT 0.00,
                selling_price DECIMAL(10,2) NOT NULL,
                current_stock INTEGER DEFAULT 0,
                reorder_level INTEGER DEFAULT 10,
                image TEXT,
                is_active BOOLEAN DEFAULT true,
                clerk_id VARCHAR(255) NOT NULL,  -- ← This is Clerk's user.id
                created_at NOT NULL DEFAULT CURRENT_DATE,
                updated_at NOT NULL DEFAULT CURRENT_DATE
            )
        `;

        // 3. Stock movements
        await sql`
            CREATE TABLE IF NOT EXISTS stock_movements (
                id SERIAL PRIMARY KEY,
                product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
                type VARCHAR(20) NOT NULL CHECK (type IN ('add','sale','return','adjustment')),
                quantity INTEGER NOT NULL,
                reason TEXT,
                clerk_id VARCHAR(255) NOT NULL,
                created_at NOT NULL DEFAULT CURRENT_DATE
            )
        `;

        // Default categories
        await sql`
            INSERT INTO categories (name) VALUES
                ('Snacks'), ('Drinks'), ('Canned Goods'), ('Toiletries'),
                ('Rice & Grains'), ('Baby Needs'), ('Frozen Items'), ('E-Load')
            ON CONFLICT (name) DO NOTHING
        `;

        // Indexes for speed
        // await sql`CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`;
        // await sql`CREATE INDEX IF NOT EXISTS idx_products_clerk ON products(clerk_id)`;

        console.log("Database ready! No users table needed — using Clerk");
    } catch (error) {
        console.error("DB init failed:", error);
        process.exit(1);
    }
}