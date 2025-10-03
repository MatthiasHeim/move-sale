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

    // Handle DELETE requests (admin - deletes product)
    if (req.method === 'DELETE') {
      try {
        console.log('🗑️ DELETE /api/products - Deleting product');

        // Extract product ID from URL path
        const urlParts = req.url?.split('/');
        const productId = urlParts?.[urlParts.length - 1];

        if (!productId) {
          await pool.end();
          return res.status(400).json({ error: 'Product ID is required' });
        }

        console.log('🔍 Deleting product ID:', productId);

        // Delete product
        const deletedProducts = await db
          .delete(products)
          .where(eq(products.id, productId))
          .returning();

        if (deletedProducts.length === 0) {
          console.log('❌ Product not found:', productId);
          await pool.end();
          return res.status(404).json({ error: 'Produkt nicht gefunden' });
        }

        console.log('🎉 Product deleted successfully:', productId);
        await pool.end();
        return res.status(200).json({
          success: true,
          message: 'Produkt erfolgreich gelöscht'
        });
      } catch (error: any) {
        console.error('💥 Error deleting product:', error);
        await pool.end();
        return res.status(500).json({
          error: 'Fehler beim Löschen des Produkts',
          details: error.message
        });
      }
    }

    // Handle PATCH requests (admin - updates product)
    if (req.method === 'PATCH') {
      try {
        console.log('✏️ PATCH /api/products - Updating product');

        // Extract product ID from URL path
        const urlParts = req.url?.split('/');
        const productId = urlParts?.[urlParts.length - 1];

        if (!productId) {
          await pool.end();
          return res.status(400).json({ error: 'Product ID is required' });
        }

        console.log('🔍 Updating product ID:', productId);
        console.log('📦 Update data:', JSON.stringify(req.body, null, 2));

        // Update validation schema (allow partial updates)
        const updateProductSchema = z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          price: z.string().or(z.number()).transform(val => String(val)).optional(),
          category: z.enum(["furniture", "appliances", "toys", "electronics", "decor", "kitchen", "sports", "outdoor", "kids_furniture", "other"]).optional(),
          imageUrls: z.array(z.string()).optional(),
          isAvailable: z.boolean().optional(),
          isPinned: z.boolean().optional(),
        }).strict();

        const validatedData = updateProductSchema.parse(req.body);
        console.log('✅ Update validation passed');

        // Update product
        const updatedProducts = await db
          .update(products)
          .set(validatedData)
          .where(eq(products.id, productId))
          .returning();

        if (updatedProducts.length === 0) {
          console.log('❌ Product not found:', productId);
          await pool.end();
          return res.status(404).json({ error: 'Produkt nicht gefunden' });
        }

        console.log('🎉 Product updated successfully:', productId);
        await pool.end();
        return res.status(200).json({
          success: true,
          message: 'Produkt erfolgreich aktualisiert',
          product: updatedProducts[0]
        });
      } catch (error: any) {
        console.error('💥 Error updating product:', error);
        await pool.end();

        if (error.name === 'ZodError') {
          console.error('📋 Validation errors:', error.errors);
          return res.status(400).json({
            error: 'Ungültige Produktdaten',
            details: error.errors
          });
        }
        return res.status(500).json({
          error: 'Fehler beim Aktualisieren des Produkts',
          details: error.message
        });
      }
    }

    // Handle POST requests (admin - creates new product OR special actions)
    if (req.method === 'POST') {
      // Check if this is a special action endpoint (mark-sold, toggle-pin)
      const urlParts = req.url?.split('/');
      const action = urlParts?.[urlParts.length - 1];
      const productId = urlParts?.[urlParts.length - 2];

      // Handle mark-sold action
      if (action === 'mark-sold' && productId) {
        try {
          console.log('💰 POST /api/products/:id/mark-sold - Marking product as sold');
          console.log('🔍 Product ID:', productId);

          const updatedProducts = await db
            .update(products)
            .set({ isAvailable: false })
            .where(eq(products.id, productId))
            .returning();

          if (updatedProducts.length === 0) {
            console.log('❌ Product not found:', productId);
            await pool.end();
            return res.status(404).json({ error: 'Produkt nicht gefunden' });
          }

          console.log('🎉 Product marked as sold:', productId);
          await pool.end();
          return res.status(200).json({
            success: true,
            message: 'Produkt als verkauft markiert',
            product: updatedProducts[0]
          });
        } catch (error: any) {
          console.error('💥 Error marking product as sold:', error);
          await pool.end();
          return res.status(500).json({
            error: 'Fehler beim Markieren als verkauft',
            details: error.message
          });
        }
      }

      // Handle toggle-pin action
      if (action === 'toggle-pin' && productId) {
        try {
          console.log('📌 POST /api/products/:id/toggle-pin - Toggling pin status');
          console.log('🔍 Product ID:', productId);

          // Get current pin status
          const currentProduct = await db
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .limit(1);

          if (currentProduct.length === 0) {
            console.log('❌ Product not found:', productId);
            await pool.end();
            return res.status(404).json({ error: 'Produkt nicht gefunden' });
          }

          const newPinStatus = !currentProduct[0].isPinned;
          console.log(`📍 Toggling pin: ${currentProduct[0].isPinned} → ${newPinStatus}`);

          const updatedProducts = await db
            .update(products)
            .set({ isPinned: newPinStatus })
            .where(eq(products.id, productId))
            .returning();

          console.log('🎉 Pin status toggled:', productId);
          await pool.end();
          return res.status(200).json({
            success: true,
            message: newPinStatus ? 'Produkt angepinnt' : 'Produkt entpinnt',
            product: updatedProducts[0]
          });
        } catch (error: any) {
          console.error('💥 Error toggling pin:', error);
          await pool.end();
          return res.status(500).json({
            error: 'Fehler beim Ändern des Pin-Status',
            details: error.message
          });
        }
      }

      // Regular product creation
      try {
        console.log('🔥 POST /api/products - Creating new product');
        console.log('📦 Request body:', JSON.stringify(req.body, null, 2));

        // Product validation schema (only fields that exist in products table)
        const insertProductSchema = z.object({
          name: z.string().min(1, "Name ist erforderlich"),
          description: z.string(),
          price: z.string().or(z.number()).transform(val => String(val)),
          category: z.enum(["furniture", "appliances", "toys", "electronics", "decor", "kitchen", "sports", "outdoor", "kids_furniture", "other"]),
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
