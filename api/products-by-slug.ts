import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Import dependencies inside handler for better serverless performance
    const { neon } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-http');
    const { eq } = await import('drizzle-orm');
    const { pgTable, text, varchar, decimal, timestamp, boolean } = await import('drizzle-orm/pg-core');

    // Define products table schema inline
    const products = pgTable('products', {
      id: varchar('id').primaryKey(),
      name: text('name').notNull(),
      slug: text('slug').notNull(),
      description: text('description').notNull(),
      price: decimal('price', { precision: 10, scale: 2 }).notNull(),
      category: text('category').notNull(),
      imageUrls: text('image_urls').array().notNull(),
      isAvailable: boolean('is_available').default(true),
      isPinned: boolean('is_pinned').default(false),
      createdAt: timestamp('created_at').defaultNow(),
    });

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Extract slug from URL path: /api/products/by-slug/{slug}
    const slug = req.url?.split('/api/products/by-slug/')[1]?.split('?')[0];

    if (!slug) {
      return res.status(400).json({ error: 'Slug parameter required' });
    }

    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (!product) {
      return res.status(404).json({ error: 'Produkt nicht gefunden' });
    }

    res.status(200).json(product);
  } catch (error: any) {
    console.error('❌ Error fetching product by slug:', error);
    res.status(500).json({
      error: 'Fehler beim Laden des Produkts',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
