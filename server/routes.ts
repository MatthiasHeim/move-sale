import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import sharp from "sharp";
// @ts-ignore - heic-convert doesn't have types
import heicConvert from "heic-convert";
import { randomBytes } from "crypto";
import fs from "fs/promises";
import { readFileSync } from "fs";
import path from "path";
// Import storage dynamically in handlers to avoid module-level database connections
async function getStorage() {
  const { storage } = await import("./storage");
  return storage;
}
import { insertProductSchema, insertFaqSchema, insertReservationSchema, agentProposalSchema, type AgentProposal } from "@shared/schema";
import { validateApiToken, optionalApiToken, API_TOKEN, requireAdminAuth, requireAuth, optionalAuth, ADMIN_PASS, type AuthenticatedRequest } from "./auth";
// Import supabase dynamically to avoid module-level initialization
// Import OpenAI dynamically to avoid module-level initialization
import OpenAI from "openai";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 8 // Max 8 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.heic')) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, HEIC, and HEIF images are allowed'));
    }
  }
});

// Image processing function
async function processImage(buffer: Buffer, originalName: string): Promise<string> {
  try {
    let imageBuffer = buffer;

    // Convert HEIC to JPEG if needed
    if (originalName.toLowerCase().endsWith('.heic') || originalName.toLowerCase().endsWith('.heif')) {
      const outputBuffer = await heicConvert({
        buffer,
        format: 'JPEG',
        quality: 1
      });
      imageBuffer = Buffer.from(outputBuffer);
    }

    // Process with Sharp: rotate, resize, convert to WebP
    const processedBuffer = await sharp(imageBuffer)
      .rotate() // Auto-rotate based on EXIF
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 82 })
      .toBuffer();

    // Generate unique filename
    const filename = `product-${Date.now()}-${randomBytes(8).toString('hex')}.webp`;

    // Save to /tmp for AI processing
    const tmpPath = `/tmp/${filename}`;
    await fs.writeFile(tmpPath, processedBuffer);
    console.log(`💾 Image saved to ${tmpPath} for AI processing`);

    // Upload to Supabase Storage
    const { uploadImageToSupabase } = await import("./supabase");
    const publicUrl = await uploadImageToSupabase(filename, processedBuffer, 'image/webp');

    console.log(`✅ Image processing complete: ${publicUrl}`);

    // Return the Supabase public URL
    return publicUrl;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
}

// Synchronous function to add routes without async operations
export function addRoutesToApp(app: Express): void {
  // Skip async operations like cleanup for serverless functions
  // They will be handled on individual requests if needed

  // === STATIC FILE SERVING ===
  
  // Note: /uploads/* images are now served directly by Vite from client/public/uploads/
  // No custom endpoint needed since we save images to both /tmp (for AI) and public (for web)

  // === ADMIN AUTHENTICATION ENDPOINTS ===
  
  // Admin login
  app.post("/api/auth/login", async (req: AuthenticatedRequest, res) => {
    try {
      const { password } = req.body;
      
      if (!password || password !== ADMIN_PASS) {
        return res.status(401).json({ error: "Invalid password" });
      }
      
      req.session.isAdmin = true;
      res.json({ 
        success: true, 
        message: "Login successful" 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  
  // Admin logout
  app.post("/api/auth/logout", async (req: AuthenticatedRequest, res) => {
    try {
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ error: "Logout failed" });
        }
        res.json({ success: true, message: "Logout successful" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });
  
  // Check admin auth status
  app.get("/api/auth/status", (req: AuthenticatedRequest, res) => {
    res.json({ 
      isAuthenticated: !!(req.session && req.session.isAdmin),
      tokenType: req.session && req.session.isAdmin ? 'admin' : null
    });
  });

  // === ADMIN-ONLY ENDPOINTS ===
  
  // Image upload endpoint
  app.post("/api/upload", requireAdminAuth, upload.array('images', 8), async (req: AuthenticatedRequest, res) => {
    try {
      console.log("📸 Upload request received");
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        console.log("❌ No files provided in upload request");
        return res.status(400).json({ error: "No images provided" });
      }
      
      console.log(`📁 Processing ${files.length} files:`, files.map(f => f.originalname));
      
      const imageUrls: string[] = [];
      const errors: string[] = [];
      
      for (const file of files) {
        try {
          console.log(`🔄 Processing file: ${file.originalname}`);
          const url = await processImage(file.buffer, file.originalname);
          imageUrls.push(url);
          console.log(`✅ Successfully processed: ${file.originalname} -> ${url}`);
        } catch (error) {
          const errorMsg = `Error processing ${file.originalname}: ${error}`;
          console.error("❌", errorMsg);
          errors.push(errorMsg);
          // Continue with other files even if one fails
        }
      }
      
      if (imageUrls.length === 0) {
        console.error("❌ Failed to process any images:", errors);
        return res.status(500).json({ 
          error: "Failed to process any images", 
          details: errors 
        });
      }
      
      console.log(`🎉 Upload completed: ${imageUrls.length}/${files.length} images processed successfully`);
      res.json({ 
        success: true,
        image_urls: imageUrls,
        processed: imageUrls.length,
        total: files.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("💥 Upload error:", error);
      res.status(500).json({ error: "Upload failed", details: String(error) });
    }
  });

  // AI Agent endpoint for product proposal generation
  app.post("/api/agent/draft", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { text, image_urls } = req.body;
      
      if (!image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
        return res.status(400).json({ error: "At least one image URL is required" });
      }
      
      // System prompt for the AI agent
      const systemPrompt = `Du bist ein Experte für Secondhand-Möbel und hilfst einer Familie aus Müllheim Dorf, die nach Hongkong umzieht. Alle Möbel und Gegenstände müssen verkauft werden.

KONTEXT:
- Familie zieht von Müllheim Dorf nach Hongkong um
- Alles muss raus - freundliche Preise
- Abholung vor Ort, Bar oder TWINT
- Kein Link in Tutti Texten, keine E-Mail oder Telefonnummer
- Falls Maße unsicher sind, Feld leer lassen oder kurze Rückfrage vorschlagen

KATEGORIEN (nur diese verwenden):
furniture, appliances, toys, electronics, decor, kitchen, sports, outdoor, kids_furniture, other

PREISGESTALTUNG:
- Preis in CHF, auf 5 CHF runden
- Als String mit 2 Dezimalstellen (z.B. "120.00")
- Faire, marktübliche Preise für gebrauchte Artikel
- Berücksichtige Zustand und Marke

ZUSTAND (nur diese verwenden):
like new, very good, good, fair

TON:
- Kurz, freundlich, klar
- Deutsch (Schweizer Hochdeutsch)
- Ehrlich über Zustand
- Positiv aber realistisch

Analysiere die Bilder und erstelle ein JSON-Objekt mit GENAU dieser Struktur:
{
  "name": "Produktname (z.B. 'IKEA Kallax Regal weiß')",
  "description": "Kurze Produktbeschreibung für internen Gebrauch",
  "price_chf": "120.00",
  "category": "furniture",
  "condition": "good", 
  "dimensions_cm": "80x40x120 (BxTxH)" oder leer lassen wenn unsicher,
  "tutti_title_de": "Eingängiger Tutti-Titel",
  "tutti_body_de": "Vollständige Tutti-Beschreibung mit Details zu Zustand, Abholung in Müllheim Dorf, Preis etc."
}

Verwende die Bilder als Hauptinformation und den Text als zusätzlichen Kontext.`;

      // Prepare the messages for OpenAI
      const userContent: any[] = [
        { 
          type: "text", 
          text: text ? `Zusätzliche Informationen: ${text}` : "Erstelle eine Produktbeschreibung basierend auf den Bildern."
        }
      ];

      // Add images to the content (using base64 for reliability)
      for (const imageUrl of image_urls.slice(0, 4)) { // Limit to 4 images for API
        try {
          // Extract filename from URL
          const filename = imageUrl.split('/').pop();
          if (!filename) continue;
          
          const filepath = `/tmp/${filename}`;
          console.log(`📖 Converting image to base64: ${filepath}`);
          
          // Read image file and convert to base64
          const imageBuffer = readFileSync(filepath);
          const base64Image = imageBuffer.toString('base64');
          
          userContent.push({
            type: "image_url",
            image_url: { 
              url: `data:image/webp;base64,${base64Image}`,
              detail: "high"
            }
          });
          
          console.log(`✅ Added base64 image: ${filename} (${imageBuffer.length} bytes)`);
        } catch (err) {
          console.error(`❌ Failed to process image ${imageUrl}:`, err);
        }
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // Use GPT-4 with vision capabilities
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userContent
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.7
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error("No response from AI");
      }

      let aiProposal;
      try {
        aiProposal = JSON.parse(responseContent);
      } catch (error) {
        console.error("Failed to parse AI response:", responseContent);
        throw new Error("Invalid JSON response from AI");
      }

      // Validate and clean up the proposal
      const validatedCategories = ["furniture", "appliances", "toys", "electronics", "decor", "kitchen", "sports", "outdoor", "kids_furniture", "other"];
      const validatedConditions = ["like new", "very good", "good", "fair"];

      // Ensure category is valid
      if (!validatedCategories.includes(aiProposal.category)) {
        aiProposal.category = "other";
      }

      // Ensure condition is valid
      if (!validatedConditions.includes(aiProposal.condition)) {
        aiProposal.condition = "good";
      }

      // Round price to nearest 5 CHF and format
      const price = parseFloat(aiProposal.price_chf || "0");
      const roundedPrice = Math.round(price / 5) * 5;
      aiProposal.price_chf = roundedPrice.toFixed(2);

      // Set cover image and gallery
      aiProposal.cover_image_url = image_urls[0];
      aiProposal.gallery_image_urls = image_urls;

      // Ensure cover image is in gallery
      if (!aiProposal.gallery_image_urls.includes(aiProposal.cover_image_url)) {
        aiProposal.gallery_image_urls = [aiProposal.cover_image_url, ...aiProposal.gallery_image_urls];
      }

      // Validate with Zod schema
      const validatedProposal = agentProposalSchema.parse(aiProposal);

      res.json({
        success: true,
        proposal: validatedProposal
      });

    } catch (error: any) {
      console.error("AI agent error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Invalid AI proposal format", 
          details: error.errors 
        });
      }
      res.status(500).json({ 
        error: "AI agent failed to generate proposal",
        details: error.message 
      });
    }
  });

  // Admin-only endpoint to get all products (including sold)
  app.get("/api/admin/products", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const storage = await getStorage();
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching admin products:", error);
      res.status(500).json({ error: "Fehler beim Laden der Admin-Produkte" });
    }
  });

  // Admin endpoint to update product
  app.patch("/api/products/:id", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const updates = req.body;
      const product = await storage.updateProduct(req.params.id, updates);
      res.json({ success: true, product });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Fehler beim Aktualisieren des Produkts" });
    }
  });

  // Admin endpoint to mark product as sold
  app.post("/api/products/:id/mark-sold", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.updateProductAvailability(req.params.id, false);
      res.json({ success: true, message: "Produkt als verkauft markiert" });
    } catch (error) {
      console.error("Error marking product as sold:", error);
      res.status(500).json({ error: "Fehler beim Markieren als verkauft" });
    }
  });

  // Admin endpoint to toggle product pinned status
  app.post("/api/products/:id/toggle-pin", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Produkt nicht gefunden" });
      }

      const newPinnedStatus = !product.isPinned;
      await storage.updateProductPinnedStatus(req.params.id, newPinnedStatus);
      res.json({
        success: true,
        message: newPinnedStatus ? "Produkt angepinnt" : "Produkt entpinnt",
        isPinned: newPinnedStatus
      });
    } catch (error) {
      console.error("Error toggling product pin status:", error);
      res.status(500).json({ error: "Fehler beim Ändern des Pin-Status" });
    }
  });

  // Admin endpoint to delete product
  app.delete("/api/products/:id", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ success: true, message: "Produkt gelöscht" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Fehler beim Löschen des Produkts" });
    }
  });

  // Products endpoints
  app.get("/api/products", async (req, res) => {
    try {
      const storage = await getStorage();
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

  // Authenticated endpoint for creating products (accepts both admin session and API token)
  app.post("/api/products", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json({
        success: true,
        message: "Produkt erfolgreich erstellt",
        product
      });
    } catch (error: any) {
      console.error("Error creating product:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Ungültige Produktdaten", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Fehler beim Erstellen des Produkts" });
    }
  });

  // API endpoint info (public)
  app.get("/api/info", (req, res) => {
    res.json({
      name: "Umzugsbeute API",
      version: "1.0.0",
      endpoints: {
        "GET /api/products": "Liste aller verfügbaren Produkte",
        "GET /api/products/:id": "Einzelnes Produkt abrufen",
        "POST /api/products": "Neues Produkt erstellen (authentifiziert)",
        "POST /api/products/:id/toggle-pin": "Produkt anpinnen/entpinnen (Admin)",
        "GET /api/faqs": "Liste aller FAQs",
        "POST /api/reservations": "Neue Reservierung erstellen",
        "GET /api/pickup-times": "Verfügbare Abholzeiten"
      },
      authentication: {
        type: "Bearer Token",
        header: "Authorization: Bearer <token>",
        required_for: ["POST /api/products"]
      },
      product_schema: {
        name: "string (required)",
        description: "string (required)",
        price: "string (required, decimal format)",
        category: "string (required: 'furniture', 'equipment', 'decor')",
        imageUrls: "array of strings (required, min 1 valid URL)"
      }
    });
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

  // Simple diagnostic endpoint that works without any imports
  app.get("/api/debug/simple", (req, res) => {
    res.json({
      status: "working",
      timestamp: new Date().toISOString(),
      message: "API endpoint responding"
    });
  });

  // Diagnostic endpoint to debug environment variables in production
  app.get("/api/debug/env", async (req, res) => {
    try {
      const envCheck = {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
        SESSION_SECRET: process.env.SESSION_SECRET ? "SET" : "NOT SET",
        ADMIN_PASS: process.env.ADMIN_PASS ? "SET" : "NOT SET",
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "SET" : "NOT SET",
        VERCEL: process.env.VERCEL ? "SET" : "NOT SET",
        allEnvKeys: Object.keys(process.env).length,
        envKeys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('SESSION') || k.includes('ADMIN') || k.includes('OPENAI') || k.includes('VERCEL'))
      };

      res.json({
        environment: envCheck,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: "Diagnostic failed",
        message: error.message,
        timestamp: new Date().toISOString()
      });
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
          imageUrls: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=400&fit=crop"]
        },
        {
          name: "Kühlschrank",
          description: "Energieeffizienter Kühlschrank, 200L Fassungsvermögen, A++ Energieklasse",
          price: "280.00",
          category: "equipment",
          imageUrls: ["https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=500&h=400&fit=crop"]
        },
        {
          name: "Vintage Nachttisch",
          description: "Authentischer Vintage-Nachttisch aus Holz mit praktischer Schublade",
          price: "75.00",
          category: "furniture",
          imageUrls: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=400&fit=crop"]
        },
        {
          name: "Dekorative Wanduhr",
          description: "Moderne Wanduhr im skandinavischen Design, 40cm Durchmesser",
          price: "25.00",
          category: "decor",
          imageUrls: ["https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=500&h=400&fit=crop"]
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

}

export async function registerRoutes(app: Express): Promise<Server> {
  // Add all routes synchronously
  addRoutesToApp(app);

  // Cleanup expired reservations on server start and periodically
  const storage = await getStorage();
  await storage.cleanupExpiredReservations();
  setInterval(async () => {
    const storage = await getStorage();
    storage.cleanupExpiredReservations().catch(console.error);
  }, 5 * 60 * 1000); // Every 5 minutes

  // Log API token for external applications
  console.log("\n🔑 API Token for external applications:");
  console.log(`   ${API_TOKEN}`);
  console.log("   Use this token in the Authorization header: 'Bearer <token>'\n");

  const httpServer = createServer(app);
  return httpServer;
}
