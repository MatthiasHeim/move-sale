// Products endpoint - handles both GET (public) and POST (admin) requests
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Import dependencies
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const { eq, and, desc } = await import('drizzle-orm');
    const ws = await import('ws');
    const { z } = await import('zod');
    const crypto = await import('crypto');

    // Import schema
    const {
      pgTable,
      text,
      decimal,
      boolean,
      timestamp,
      varchar
    } = await import('drizzle-orm/pg-core');

    // Define products table schema (matching shared/schema.ts)
    const products = pgTable('products', {
      id: varchar('id').primaryKey(),
      name: text('name').notNull(),
      description: text('description').notNull(),
      price: decimal('price', { precision: 10, scale: 2 }).notNull(),
      category: text('category').notNull(),
      imageUrls: text('image_urls').array().notNull(),
      isAvailable: boolean('is_available').default(true),
      isPinned: boolean('is_pinned').default(false),
      createdAt: timestamp('created_at').defaultNow(),
    });

    // Setup database connection
    neonConfig.webSocketConstructor = ws.default;

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: "DATABASE_URL not set" });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema: { products } });

    // Handle GET requests (public - returns available products only)
    if (req.method === 'GET') {
      try {
        const category = req.query.category as string;
        let productsList;

        if (category && category !== 'all') {
          productsList = await db
            .select()
            .from(products)
            .where(and(
              eq(products.category, category),
              eq(products.isAvailable, true)
            ))
            .orderBy(desc(products.isPinned), desc(products.createdAt));
        } else {
          productsList = await db
            .select()
            .from(products)
            .where(eq(products.isAvailable, true))
            .orderBy(desc(products.isPinned), desc(products.createdAt));
        }

        await pool.end();
        return res.status(200).json(productsList);
      } catch (error) {
        console.error('Error fetching products:', error);
        await pool.end();
        return res.status(500).json({ error: 'Fehler beim Laden der Produkte' });
      }
    }

    // Handle POST requests (admin - creates new product)
    if (req.method === 'POST') {
      try {
        console.log('🔥 POST /api/products - Creating new product');
        console.log('📦 Request body:', JSON.stringify(req.body, null, 2));

        // Product validation schema (only fields that exist in products table)
        const insertProductSchema = z.object({
          name: z.string().min(1, "Name ist erforderlich"),
          description: z.string(),
          price: z.string().or(z.number()).transform(val => String(val)),
          category: z.enum(['furniture', 'equipment', 'decor']),
          imageUrls: z.array(z.string()).min(1, "Mindestens ein Bild erforderlich"),
          isAvailable: z.boolean().default(true),
          isPinned: z.boolean().default(false),
        });

        const validatedData = insertProductSchema.parse(req.body);
        console.log('✅ Data validation passed');

        // Generate unique ID
        const productId = `prod_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        // Insert product (only fields that exist in the database schema)
        const [product] = await db.insert(products).values({
          id: productId,
          name: validatedData.name,
          description: validatedData.description,
          price: validatedData.price,
          category: validatedData.category,
          imageUrls: validatedData.imageUrls,
          isAvailable: validatedData.isAvailable,
          isPinned: validatedData.isPinned,
        }).returning();

        console.log('🎉 Product created successfully:', product.id);

        await pool.end();
        return res.status(201).json({
          success: true,
          message: 'Produkt erfolgreich erstellt',
          product
        });
      } catch (error: any) {
        console.error('💥 Error creating product:', error);
        await pool.end();

        if (error.name === 'ZodError') {
          console.error('📋 Validation errors:', error.errors);
          return res.status(400).json({
            error: 'Ungültige Produktdaten',
            details: error.errors
          });
        }
        return res.status(500).json({
          error: 'Fehler beim Erstellen des Produkts',
          details: error.message
        });
      }
    }

    // Method not allowed
    await pool.end();
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Products API error:', error);
    return res.status(500).json({
      error: "Request failed",
      details: error.message,
      stack: error.stack
    });
  }
}
