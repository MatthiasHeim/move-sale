import type { VercelRequest, VercelResponse } from '@vercel/node';
import { insertReservationSchema } from '../server/schema';

// Dynamic imports to avoid module-level initialization
async function getStorage() {
  const { storage } = await import('../server/storage');
  return storage;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const storage = await getStorage();

    // POST /api/reservations - Create new reservation
    if (req.method === 'POST') {
      const validatedData = insertReservationSchema.parse(req.body);

      // Check if product is still available
      const product = await storage.getProductById(validatedData.productId);
      if (!product) {
        return res.status(404).json({ error: "Produkt nicht gefunden" });
      }
      if (!product.isAvailable) {
        return res.status(400).json({ error: "Produkt ist nicht mehr verfügbar" });
      }

      const reservation = await storage.createReservation(validatedData);

      // Mark product as unavailable
      await storage.updateProductAvailability(validatedData.productId, false);

      return res.status(201).json(reservation);
    }

    // GET /api/reservations/:id - Get reservation by ID
    if (req.method === 'GET' && req.query.id) {
      const reservation = await storage.getReservationById(req.query.id as string);
      if (!reservation) {
        return res.status(404).json({ error: "Reservierung nicht gefunden" });
      }
      return res.status(200).json(reservation);
    }

    // PATCH /api/reservations/:id/status - Update reservation status
    if (req.method === 'PATCH' && req.query.id) {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status ist erforderlich" });
      }

      await storage.updateReservationStatus(req.query.id as string, status);
      return res.status(200).json({ success: true });
    }

    // Method not allowed
    return res.status(405).json({ error: "Method not allowed" });

  } catch (error: any) {
    console.error("Error in reservations endpoint:", error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: "Ungültige Reservierungsdaten",
        details: error.errors
      });
    }

    return res.status(500).json({
      error: "Fehler bei der Reservierung",
      details: error.message
    });
  }
}
