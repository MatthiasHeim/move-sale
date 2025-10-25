// Admin reservations endpoint - returns all reservations with product details
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Import database dependencies
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const { eq, desc } = await import('drizzle-orm');
    const ws = await import('ws');

    // Import schema types
    const {
      pgTable,
      text,
      decimal,
      boolean,
      timestamp,
      varchar
    } = await import('drizzle-orm/pg-core');

    // Products table definition
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

    // Reservations table definition
    const reservations = pgTable('reservations', {
      id: varchar('id').primaryKey(),
      productId: varchar('product_id').notNull(),
      customerName: text('customer_name').notNull(),
      customerPhone: text('customer_phone').notNull(),
      pickupTime: timestamp('pickup_time', { withTimezone: true }).notNull(),
      status: text('status').notNull(),
      createdAt: timestamp('created_at', { withTimezone: true }),
      expiresAt: timestamp('expires_at', { withTimezone: true }),
    });

    neonConfig.webSocketConstructor = ws.default;

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: "DATABASE_URL not set" });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema: { products, reservations } });

    // Query reservations with product details using left join
    const reservationsData = await db.select({
      id: reservations.id,
      productId: reservations.productId,
      customerName: reservations.customerName,
      customerPhone: reservations.customerPhone,
      pickupTime: reservations.pickupTime,
      status: reservations.status,
      createdAt: reservations.createdAt,
      expiresAt: reservations.expiresAt,
      productName: products.name,
      productPrice: products.price,
      productImageUrls: products.imageUrls,
    })
    .from(reservations)
    .leftJoin(products, eq(reservations.productId, products.id))
    .orderBy(desc(reservations.createdAt));

    // Transform data to include the first image as cover image
    const transformedData = reservationsData.map(res => ({
      ...res,
      productCoverImage: res.productImageUrls?.[0] || null,
      productImageUrls: undefined, // Remove from response
    }));

    await pool.end();

    res.json(transformedData);

  } catch (error: any) {
    console.error('Admin Reservations API error:', error);
    res.status(500).json({
      error: "Failed to load admin reservations",
      details: error.message,
      stack: error.stack
    });
  }
}
