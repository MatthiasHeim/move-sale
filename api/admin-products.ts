// Admin products endpoint - returns all products including sold ones
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

    // Complete products table definition matching the schema
    const products = pgTable('products', {
      id: varchar('id').primaryKey(),
      name: text('name'),
      description: text('description'),
      price: decimal('price', { precision: 10, scale: 2 }),
      category: text('category'),
      imageUrls: text('image_urls').array(),
      isAvailable: boolean('is_available'),
      isPinned: boolean('is_pinned'),
      createdAt: timestamp('created_at'),
    });

    neonConfig.webSocketConstructor = ws.default;

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: "DATABASE_URL not set" });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema: { products } });

    // Query ALL products for admin view (including sold/unavailable)
    const productsList = await db.select().from(products)
      .orderBy(products.createdAt)
      .limit(50);

    await pool.end();

    res.json({
      success: true,
      count: productsList.length,
      message: "Admin products loaded successfully!",
      products: productsList
    });

  } catch (error) {
    console.error('Admin Products API error:', error);
    res.status(500).json({
      error: "Failed to load admin products",
      details: error.message,
      stack: error.stack
    });
  }
}