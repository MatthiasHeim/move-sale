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

    // Query available products only
    const { eq } = await import('drizzle-orm');
    const productsList = await db.select().from(products)
      .where(eq(products.isAvailable, true))
      .orderBy(products.createdAt)
      .limit(20);

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