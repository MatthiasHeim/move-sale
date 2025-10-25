// Reservations endpoint - handles reservation creation and status updates
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Import dependencies
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const { eq } = await import('drizzle-orm');
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

    // Define tables
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

    const reservations = pgTable('reservations', {
      id: varchar('id').primaryKey(),
      productId: varchar('product_id').notNull(),
      customerName: text('customer_name').notNull(),
      customerPhone: text('customer_phone').notNull(),
      pickupTime: timestamp('pickup_time').notNull(),
      status: text('status').notNull().default('pending'),
      createdAt: timestamp('created_at').defaultNow(),
      expiresAt: timestamp('expires_at').notNull(),
    });

    // Setup database connection
    neonConfig.webSocketConstructor = ws.default;

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: "DATABASE_URL not set" });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema: { products, reservations } });

    // Handle POST requests - Create new reservation
    if (req.method === 'POST') {
      try {
        console.log('📝 POST /api/reservations - Creating reservation');
        console.log('📦 Request body:', JSON.stringify(req.body, null, 2));

        // Validation schema
        const insertReservationSchema = z.object({
          productId: z.string(),
          customerName: z.string().min(1),
          customerPhone: z.string().min(1),
          pickupTime: z.string(),
        });

        const validatedData = insertReservationSchema.parse(req.body);
        console.log('✅ Validation passed');

        // Check if product exists and is available
        const product = await db
          .select()
          .from(products)
          .where(eq(products.id, validatedData.productId))
          .limit(1);

        if (product.length === 0) {
          await pool.end();
          return res.status(404).json({ error: "Produkt nicht gefunden" });
        }

        if (!product[0].isAvailable) {
          await pool.end();
          return res.status(400).json({ error: "Produkt ist nicht mehr verfügbar" });
        }

        // Generate unique ID
        const reservationId = `res_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        // Calculate expiration (48 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);

        // Create reservation
        const [reservation] = await db.insert(reservations).values({
          id: reservationId,
          productId: validatedData.productId,
          customerName: validatedData.customerName,
          customerPhone: validatedData.customerPhone,
          pickupTime: new Date(validatedData.pickupTime),
          status: 'pending',
          expiresAt,
        }).returning();

        // Mark product as unavailable
        await db
          .update(products)
          .set({ isAvailable: false })
          .where(eq(products.id, validatedData.productId));

        console.log('🎉 Reservation created:', reservationId);

        // Trigger webhook notification
        console.log('🔔 Starting webhook notification process...');
        try {
          const webhookUrl = "https://primary-production-460f.up.railway.app/webhook/75dce36d-5bd8-42ee-94d1-feda671650ca";

          // Format pickup time for display
          const pickupDate = new Date(reservation.pickupTime);
          const formattedPickupTime = pickupDate.toLocaleString('de-CH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Zurich'
          });

          const webhookPayload = {
            event: "reservation.created",
            // Flat structure for easier n8n access
            reservationId: reservation.id,
            customerName: reservation.customerName,
            customerPhone: reservation.customerPhone,
            pickupTime: formattedPickupTime,
            pickupTimeRaw: reservation.pickupTime,
            status: reservation.status,
            productId: product[0].id,
            productName: product[0].name,
            productPrice: `CHF ${product[0].price}`,
            productImage: product[0].imageUrls[0] || null,
            createdAt: reservation.createdAt,
          };

          console.log('📤 Sending webhook to:', webhookUrl);
          console.log('📦 Payload:', JSON.stringify(webhookPayload, null, 2));

          const webhookResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload),
          });

          console.log('📬 Webhook response status:', webhookResponse.status);
          const responseText = await webhookResponse.text();
          console.log('📬 Webhook response body:', responseText);

          if (!webhookResponse.ok) {
            console.error('⚠️ Webhook failed with status:', webhookResponse.status);
            console.error('⚠️ Response:', responseText);
          } else {
            console.log('✅ Webhook sent successfully!');
          }
        } catch (webhookError: any) {
          console.error('❌ Webhook error:', webhookError.message);
          // Don't fail the reservation if webhook fails
        }

        await pool.end();
        return res.status(201).json(reservation);

      } catch (error: any) {
        console.error('💥 Error creating reservation:', error);
        await pool.end();

        if (error.name === 'ZodError') {
          return res.status(400).json({
            error: 'Ungültige Reservierungsdaten',
            details: error.errors
          });
        }

        return res.status(500).json({
          error: 'Fehler bei der Reservierung',
          details: error.message
        });
      }
    }

    // Handle GET requests - Get reservation by ID
    if (req.method === 'GET') {
      try {
        const reservationId = req.query.id as string;

        if (!reservationId) {
          await pool.end();
          return res.status(400).json({ error: 'Reservation ID required' });
        }

        const reservation = await db
          .select()
          .from(reservations)
          .where(eq(reservations.id, reservationId))
          .limit(1);

        if (reservation.length === 0) {
          await pool.end();
          return res.status(404).json({ error: "Reservierung nicht gefunden" });
        }

        await pool.end();
        return res.status(200).json(reservation[0]);

      } catch (error: any) {
        console.error('Error fetching reservation:', error);
        await pool.end();
        return res.status(500).json({ error: 'Fehler beim Laden der Reservierung' });
      }
    }

    // Handle PATCH requests - Update reservation status
    if (req.method === 'PATCH') {
      try {
        const reservationId = req.query.id as string;
        const { status } = req.body;

        if (!reservationId) {
          await pool.end();
          return res.status(400).json({ error: 'Reservation ID required' });
        }

        if (!status) {
          await pool.end();
          return res.status(400).json({ error: "Status ist erforderlich" });
        }

        await db
          .update(reservations)
          .set({ status })
          .where(eq(reservations.id, reservationId));

        await pool.end();
        return res.status(200).json({ success: true });

      } catch (error: any) {
        console.error('Error updating reservation:', error);
        await pool.end();
        return res.status(500).json({ error: 'Fehler beim Aktualisieren der Reservierung' });
      }
    }

    // Method not allowed
    await pool.end();
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Reservations API error:', error);
    return res.status(500).json({
      error: "Request failed",
      details: error.message,
      stack: error.stack
    });
  }
}
