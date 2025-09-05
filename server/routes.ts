import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertFaqSchema, insertReservationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Cleanup expired reservations on server start and periodically
  await storage.cleanupExpiredReservations();
  setInterval(() => {
    storage.cleanupExpiredReservations().catch(console.error);
  }, 5 * 60 * 1000); // Every 5 minutes

  // Products endpoints
  app.get("/api/products", async (req, res) => {
    try {
      const category = req.query.category as string;
      let products;
      
      if (category && category !== "all") {
        products = await storage.getProductsByCategory(category);
      } else {
        products = await storage.getProducts();
      }
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Fehler beim Laden der Produkte" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Produkt nicht gefunden" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Fehler beim Laden des Produkts" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ error: "Ungültige Produktdaten" });
    }
  });

  // FAQs endpoints
  app.get("/api/faqs", async (req, res) => {
    try {
      const faqs = await storage.getFaqs();
      res.json(faqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      res.status(500).json({ error: "Fehler beim Laden der FAQs" });
    }
  });

  app.post("/api/faqs", async (req, res) => {
    try {
      const validatedData = insertFaqSchema.parse(req.body);
      const faq = await storage.createFaq(validatedData);
      res.status(201).json(faq);
    } catch (error) {
      console.error("Error creating FAQ:", error);
      res.status(400).json({ error: "Ungültige FAQ-Daten" });
    }
  });

  // Reservations endpoints
  app.post("/api/reservations", async (req, res) => {
    try {
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
      
      res.status(201).json(reservation);
    } catch (error) {
      console.error("Error creating reservation:", error);
      res.status(400).json({ error: "Fehler bei der Reservierung" });
    }
  });

  app.get("/api/reservations/:id", async (req, res) => {
    try {
      const reservation = await storage.getReservationById(req.params.id);
      if (!reservation) {
        return res.status(404).json({ error: "Reservierung nicht gefunden" });
      }
      res.json(reservation);
    } catch (error) {
      console.error("Error fetching reservation:", error);
      res.status(500).json({ error: "Fehler beim Laden der Reservierung" });
    }
  });

  app.patch("/api/reservations/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status ist erforderlich" });
      }

      await storage.updateReservationStatus(req.params.id, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating reservation status:", error);
      res.status(500).json({ error: "Fehler beim Aktualisieren der Reservierung" });
    }
  });

  // Available pickup times endpoint (Google Calendar integration would go here)
  app.get("/api/pickup-times", async (req, res) => {
    try {
      // Mock available times based on business hours
      // In production, this would integrate with Google Calendar API
      const now = new Date();
      const availableTimes: Array<{
        datetime: string;
        display: string;
        value: string;
      }> = [];
      
      // Generate next 7 days of available slots
      for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        
        // Skip if it's current day and already past business hours
        if (i === 0 && (date.getHours() >= 19 || (date.getDay() === 0 || date.getDay() === 6 && date.getHours() >= 16))) {
          continue;
        }
        
        const dayOfWeek = date.getDay();
        let timeSlots: string[] = [];
        
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
          timeSlots = ["17:00-18:00", "18:00-19:00"];
        } else if (dayOfWeek === 6 || dayOfWeek === 0) { // Saturday or Sunday
          timeSlots = ["10:00-11:00", "11:00-12:00", "14:00-15:00", "15:00-16:00"];
        }
        
        timeSlots.forEach(slot => {
          const [startTime] = slot.split('-');
          const pickupTime = new Date(date);
          const [hours, minutes] = startTime.split(':').map(Number);
          pickupTime.setHours(hours, minutes, 0, 0);
          
          if (pickupTime > now) {
            availableTimes.push({
              datetime: pickupTime.toISOString(),
              display: `${date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'short' })}, ${slot}`,
              value: pickupTime.toISOString()
            });
          }
        });
      }
      
      res.json(availableTimes);
    } catch (error) {
      console.error("Error fetching pickup times:", error);
      res.status(500).json({ error: "Fehler beim Laden der Abholzeiten" });
    }
  });

  // Sample data creation endpoint for development
  app.post("/api/init-sample-data", async (req, res) => {
    try {
      // Create sample products
      const sampleProducts = [
        {
          name: "Gemütliches Sofa",
          description: "Bequemes 3-Sitzer Sofa in dunkelgrau, perfekt für das Wohnzimmer",
          price: "350.00",
          category: "furniture",
          imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=400&fit=crop"
        },
        {
          name: "Kühlschrank",
          description: "Energieeffizienter Kühlschrank, 200L Fassungsvermögen, A++ Energieklasse",
          price: "280.00",
          category: "equipment",
          imageUrl: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=500&h=400&fit=crop"
        },
        {
          name: "Vintage Nachttisch",
          description: "Authentischer Vintage-Nachttisch aus Holz mit praktischer Schublade",
          price: "75.00",
          category: "furniture",
          imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=400&fit=crop"
        },
        {
          name: "Dekorative Wanduhr",
          description: "Moderne Wanduhr im skandinavischen Design, 40cm Durchmesser",
          price: "25.00",
          category: "decor",
          imageUrl: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=500&h=400&fit=crop"
        }
      ];

      for (const product of sampleProducts) {
        await storage.createProduct(product);
      }

      // Create sample FAQs
      const sampleFaqs = [
        {
          question: "Wie funktioniert die Reservierung?",
          answer: "Sie können einen Artikel direkt über die Webseite reservieren. Die Reservierung ist 48 Stunden gültig.",
          order: 1
        },
        {
          question: "Wann kann ich die Artikel abholen?",
          answer: "Abholzeiten sind Mo-Fr 17:00-19:00 und Sa-So 10:00-16:00. Der genaue Termin wird bei der Reservierung vereinbart.",
          order: 2
        },
        {
          question: "Sind die Preise verhandelbar?",
          answer: "Die Preise sind bereits fair kalkuliert, aber bei Abnahme mehrerer Artikel können wir gerne sprechen.",
          order: 3
        }
      ];

      for (const faq of sampleFaqs) {
        await storage.createFaq(faq);
      }

      res.json({ message: "Sample data created successfully" });
    } catch (error) {
      console.error("Error creating sample data:", error);
      res.status(500).json({ error: "Fehler beim Erstellen der Beispieldaten" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
