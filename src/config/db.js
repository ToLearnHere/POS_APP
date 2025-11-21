import { neon } from '@neondatabase/serverless';
import "dotenv/config";

// Create a SQL connection using our DB URL
export const sql = neon(process.env.DATABASE_URL);

// Initialize all tables (run once or on startup)
export async function initDB() {
    try {

        // --- 1. Utility for Automatic Updated_At ---
        // This is a single CREATE OR REPLACE FUNCTION command, so it's safe.
        await sql`
            CREATE OR REPLACE FUNCTION set_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `;
        
        // 2. Categories
        await sql`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            )
        `;

        // 3. Products — Stores current stock and key item details
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
                clerk_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), 
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() 
            )
        `;
        
        // 4. Trigger for Products (Automatic updated_at)
        // FIX: Separate DROP TRIGGER and CREATE TRIGGER into two commands.

        // 4a. Drop the trigger (Command 1)
        await sql`DROP TRIGGER IF EXISTS set_products_updated_at ON products`;
        
        // 4b. Create the trigger (Command 2)
        await sql`
            CREATE TRIGGER set_products_updated_at
            BEFORE UPDATE ON products
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at()
        `;
        
        // --- Sales and Inventory Tables ---

        // 5. Sales Orders (Transaction Header)
        await sql`
            CREATE TABLE IF NOT EXISTS sales_orders (
                id SERIAL PRIMARY KEY,
                clerk_id VARCHAR(255) NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                payment_method VARCHAR(50),
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            )
        `;

        // 6. Sales Items (Transaction Line Items - DECREMENTS STOCK)
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

        // 7. Stock Movements (Non-Sales Inventory Changes - INCREMENTS/ADJUSTS STOCK)
        await sql`
            CREATE TABLE IF NOT EXISTS stock_movements (
                id SERIAL PRIMARY KEY,
                product_id UUID REFERENCES products(product_id) ON DELETE CASCADE NOT NULL,
                type VARCHAR(20) NOT NULL CHECK (type IN ('add_stock','return','adjustment','wastage')),
                quantity INTEGER NOT NULL,
                reason TEXT,
                clerk_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            )
        `;


        // 8. Default categories (This is a single INSERT...ON CONFLICT statement, so it's safe)
        await sql`
            INSERT INTO categories (name) VALUES
                ('Snacks'), ('Drinks'), ('Canned Goods'), ('Toiletries'),
                ('Rice & Grains'), ('Baby Needs'), ('Frozen Items'), ('E-Load')
            ON CONFLICT (name) DO NOTHING
        `;

        // 9. Indexes for speed (All are correctly separated)
        await sql`CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_products_clerk ON products(clerk_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sales_orders_clerk ON sales_orders(clerk_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sales_items_order ON sales_items(order_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sales_items_product ON sales_items(product_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id)`;


        console.log("Database ready! Inventory and Sales tables initialized.");
    } catch (error) {
        console.error("DB init failed:", error);
        process.exit(1);
    }
}