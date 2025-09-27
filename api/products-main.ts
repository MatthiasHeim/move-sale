// Main products endpoint using the working pattern with correct schema
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Import database dependencies dynamically
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const ws = await import('ws');

    // Import the complete schema from server directory
    const schema = await import('../server/schema');

    neonConfig.webSocketConstructor = ws.default;

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: "DATABASE_URL not set" });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema });

    // Get available products only (mimicking the main API behavior)
    const { eq } = await import('drizzle-orm');
    const products = await db.select().from(schema.products)
      .where(eq(schema.products.available, true))
      .orderBy(schema.products.createdAt);

    await pool.end();

    res.json(products);

  } catch (error) {
    console.error('Products API error:', error);
    res.status(500).json({
      error: "Database query failed",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}