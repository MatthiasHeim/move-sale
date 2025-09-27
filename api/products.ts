// Direct products endpoint to test database connectivity
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Test just the basic database import and connection
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const ws = await import('ws');
    const schema = await import('../shared/schema.ts');

    neonConfig.webSocketConstructor = ws.default;

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: "DATABASE_URL not set" });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema });

    // Try to query products
    const products = await db.select().from(schema.products);

    await pool.end();

    res.json({
      success: true,
      count: products.length,
      products: products.slice(0, 3) // First 3 for testing
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