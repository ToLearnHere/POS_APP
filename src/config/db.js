// db/initDB.js
import { neon } from '@neondatabase/serverless';
import "dotenv/config";

export const sql = neon(process.env.DATABASE_URL);

export async function initDB() {
    try {
        console.log("Initializing database...");

        // --- 1. Utility: Auto update updated_at ---
        await sql`
            CREATE OR REPLACE FUNCTION set_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `;

        // --- 2. Categories ---
        await sql`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            )
        `;

        // --- 3. Products Table (with safe migration for user_id) ---
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
                image TEXT,
                is_active BOOLEAN DEFAULT true,
                user_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            )
        `;

        // THIS FIXES YOUR ERROR: Add user_id column if table was created before it existed
        await sql`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS user_id VARCHAR(255) NOT NULL DEFAULT 'temp-migration-user'
        `;

        // Clean up the temporary default (safe to run multiple times)
        await sql`
            ALTER TABLE products 
            ALTER COLUMN user_id DROP DEFAULT
        `;

        // --- 4. Auto updated_at trigger for products ---
        await sql`DROP TRIGGER IF EXISTS set_products_updated_at ON products`;

        await sql`
            CREATE TRIGGER set_products_updated_at
            BEFORE UPDATE ON products
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at()
        `;

        // --- 5. Sales Orders ---
        await sql`
            CREATE TABLE IF NOT EXISTS sales_orders (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                payment_method VARCHAR(50),
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            )
        `;

        // --- 6. Sales Items ---
        await sql`
            CREATE TABLE IF NOT EXISTS sales_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES sales_orders(id) ON DELETE CASCADE NOT NULL,
                product_id UUID REFERENCES products(product_id) ON DELETE RESTRICT NOT NULL,
                quantity INTEGER NOT NULL CHECK (quantity > 0),
                unit_selling_price DECIMAL(10,2) NOT NULL,
                line_total DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            )
        `;

        // --- 7. Stock Movements ---
        await sql`
            CREATE TABLE IF NOT EXISTS stock_movements (
                id SERIAL PRIMARY KEY,
                product_id UUID REFERENCES products(product_id) ON DELETE CASCADE NOT NULL,
                type VARCHAR(20) NOT NULL CHECK (type IN ('add_stock','return','adjustment','wastage')),
                quantity INTEGER NOT NULL,
                reason TEXT,
                user_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            )
        `;

        // --- 8. Insert Default Categories ---
        await sql`
            INSERT INTO categories (name) VALUES
                ('Snacks'), ('Drinks'), ('Canned Goods'), ('Toiletries'),
                ('Rice & Grains'), ('Baby Needs'), ('Frozen Items'), ('E-Load')
            ON CONFLICT (name) DO NOTHING
        `;

        // --- 9. Optional: Useful Indexes ---
        await sql`CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sales_orders_user ON sales_orders(user_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id)`;

        console.log("Database initialized successfully! All tables ready.");
        console.log("user_id column is now guaranteed to exist in products table.");
        
    } catch (error) {
        console.error("Database initialization FAILED:", error);
        console.error("Error details:", error.message);
        process.exit(1);
    }
}

// Run this on server startup (optional)
// initDB();