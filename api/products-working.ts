// Working products endpoint with embedded schema for testing
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Import database dependencies
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const ws = await import('ws');

    // Import schema types - we'll create a minimal version inline
    const {
      pgTable,
      serial,
      text,
      decimal,
      boolean,
      timestamp,
      varchar
    } = await import('drizzle-orm/pg-core');

    // Minimal products table definition - only basic columns that definitely exist
    const products = pgTable('products', {
      id: serial('id').primaryKey(),
      name: text('name'),
      description: text('description'),
      price: decimal('price', { precision: 10, scale: 2 }),
      category: varchar('category', { length: 50 }),
      available: boolean('available'),
      createdAt: timestamp('created_at'),
    });

    neonConfig.webSocketConstructor = ws.default;

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: "DATABASE_URL not set" });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema: { products } });

    // Try to query products
    const productsList = await db.select().from(products).limit(10);

    await pool.end();

    res.json({
      success: true,
      count: productsList.length,
      message: "Database connection successful!",
      products: productsList
    });

  } catch (error) {
    console.error('Products API error:', error);
    res.status(500).json({
      error: "Database connection failed",
      details: error.message,
      stack: error.stack
    });
  }
}