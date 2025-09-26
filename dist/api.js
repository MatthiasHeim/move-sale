var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// api/index.ts
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

// server/routes.ts
import { createServer } from "http";
import multer from "multer";
import sharp from "sharp";
import heicConvert from "heic-convert";
import { randomBytes } from "crypto";
import fs from "fs/promises";
import { readFileSync } from "fs";
import path from "path";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  agentProposalSchema: () => agentProposalSchema,
  drafts: () => drafts,
  faqs: () => faqs,
  insertDraftSchema: () => insertDraftSchema,
  insertFaqSchema: () => insertFaqSchema,
  insertProductSchema: () => insertProductSchema,
  insertProductTextSchema: () => insertProductTextSchema,
  insertReservationSchema: () => insertReservationSchema,
  productTexts: () => productTexts,
  products: () => products,
  reservations: () => reservations
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  // "furniture", "equipment", "decor"
  imageUrls: text("image_urls").array().notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull()
});
var faqs = pgTable("faqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull()
});
var reservations = pgTable("reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  pickupTime: timestamp("pickup_time").notNull(),
  status: text("status").default("pending").notNull(),
  // "pending", "confirmed", "completed", "cancelled"
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  expiresAt: timestamp("expires_at").notNull()
});
var productTexts = pgTable("product_texts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  tuttiTitleDe: text("tutti_title_de").notNull(),
  tuttiBodyDe: text("tutti_body_de").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull()
});
var drafts = pgTable("drafts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  images: text("images").array().notNull(),
  rawInput: text("raw_input"),
  proposal: jsonb("proposal"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull()
});
var insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true
}).extend({
  imageUrls: z.array(z.string()).min(1, "At least one image URL is required")
  // Allow relative URLs like /uploads/filename.webp
});
var insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdAt: true
});
var insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
  createdAt: true,
  expiresAt: true
}).extend({
  pickupTime: z.string().transform((str) => new Date(str))
});
var insertProductTextSchema = createInsertSchema(productTexts).omit({
  id: true,
  createdAt: true
});
var insertDraftSchema = createInsertSchema(drafts).omit({
  id: true,
  createdAt: true
});
var agentProposalSchema = z.object({
  name: z.string(),
  description: z.string(),
  price_chf: z.string().regex(/^\d+\.\d{2}$/, "Price must be in format XX.XX"),
  category: z.enum(["furniture", "appliances", "toys", "electronics", "decor", "kitchen", "sports", "outdoor", "kids_furniture", "other"]),
  condition: z.enum(["like new", "very good", "good", "fair"]),
  dimensions_cm: z.string().optional(),
  cover_image_url: z.string(),
  // Allow relative URLs like /uploads/filename.webp
  gallery_image_urls: z.array(z.string()),
  // Allow relative URLs
  tutti_title_de: z.string(),
  tutti_body_de: z.string()
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, asc, and } from "drizzle-orm";
import { sql as sql2 } from "drizzle-orm";
var DatabaseStorage = class {
  async getProducts() {
    return await db.select().from(products).where(eq(products.isAvailable, true)).orderBy(desc(products.isPinned), desc(products.createdAt));
  }
  async getProductsByCategory(category) {
    return await db.select().from(products).where(and(eq(products.category, category), eq(products.isAvailable, true))).orderBy(desc(products.isPinned), desc(products.createdAt));
  }
  async getProductById(id) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || void 0;
  }
  async createProduct(insertProduct) {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }
  async getAllProducts() {
    return await db.select().from(products).orderBy(desc(products.isPinned), desc(products.createdAt));
  }
  async updateProduct(id, updates) {
    const [product] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return product;
  }
  async updateProductAvailability(id, isAvailable) {
    await db.update(products).set({ isAvailable }).where(eq(products.id, id));
  }
  async updateProductPinnedStatus(id, isPinned) {
    await db.update(products).set({ isPinned }).where(eq(products.id, id));
  }
  async deleteProduct(id) {
    await db.delete(products).where(eq(products.id, id));
  }
  async getFaqs() {
    return await db.select().from(faqs).orderBy(asc(faqs.order));
  }
  async createFaq(insertFaq) {
    const [faq] = await db.insert(faqs).values(insertFaq).returning();
    return faq;
  }
  async createReservation(insertReservation) {
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);
    const [reservation] = await db.insert(reservations).values({
      ...insertReservation,
      expiresAt
    }).returning();
    return reservation;
  }
  async getReservationById(id) {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation || void 0;
  }
  async getReservationsByProduct(productId) {
    return await db.select().from(reservations).where(eq(reservations.productId, productId)).orderBy(desc(reservations.createdAt));
  }
  async updateReservationStatus(id, status) {
    await db.update(reservations).set({ status }).where(eq(reservations.id, id));
  }
  async cleanupExpiredReservations() {
    const expiredReservations = await db.select().from(reservations).where(and(
      eq(reservations.status, "pending"),
      sql2`${reservations.expiresAt} < now()`
    ));
    for (const reservation of expiredReservations) {
      await db.update(reservations).set({ status: "expired" }).where(eq(reservations.id, reservation.id));
      await db.update(products).set({ isAvailable: true }).where(eq(products.id, reservation.productId));
    }
  }
  // Product Texts (Tutti archive)
  async createProductText(productText) {
    const [text2] = await db.insert(productTexts).values(productText).returning();
    return text2;
  }
  async getProductTextsByProductId(productId) {
    return await db.select().from(productTexts).where(eq(productTexts.productId, productId)).orderBy(desc(productTexts.createdAt));
  }
  // Drafts
  async createDraft(draft) {
    const [newDraft] = await db.insert(drafts).values(draft).returning();
    return newDraft;
  }
  async getDraftById(id) {
    const [draft] = await db.select().from(drafts).where(eq(drafts.id, id));
    return draft || void 0;
  }
  async getDrafts() {
    return await db.select().from(drafts).orderBy(desc(drafts.createdAt));
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import crypto from "crypto";
var API_TOKEN = process.env.API_TOKEN || "mbm_" + crypto.randomBytes(32).toString("hex");
var ADMIN_PASS = process.env.ADMIN_PASS;
function requireAdminAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    req.isAuthenticated = true;
    req.tokenType = "admin";
    next();
  } else {
    res.status(401).json({
      error: "Admin authentication required. Please log in."
    });
  }
}
function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    req.isAuthenticated = true;
    req.tokenType = "admin";
    return next();
  }
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const [scheme, token] = authHeader.split(" ");
    if (scheme === "Bearer" && token === API_TOKEN) {
      req.isAuthenticated = true;
      req.tokenType = "api";
      return next();
    }
  }
  res.status(401).json({
    error: "Authentication required. Please log in or provide a valid API token."
  });
}

// server/routes.ts
import OpenAI from "openai";
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    // 10MB limit
    files: 8
    // Max 8 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/heic", "image/heif"];
    if (allowedTypes.includes(file.mimetype) || file.originalname.toLowerCase().endsWith(".heic")) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, HEIC, and HEIF images are allowed"));
    }
  }
});
async function processImage(buffer, originalName) {
  try {
    let imageBuffer = buffer;
    if (originalName.toLowerCase().endsWith(".heic") || originalName.toLowerCase().endsWith(".heif")) {
      const outputBuffer = await heicConvert({
        buffer,
        format: "JPEG",
        quality: 1
      });
      imageBuffer = Buffer.from(outputBuffer);
    }
    const processedBuffer = await sharp(imageBuffer).rotate().resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true
    }).webp({ quality: 82 }).toBuffer();
    const filename = `product-${Date.now()}-${randomBytes(8).toString("hex")}.webp`;
    const tmpPath = `/tmp/${filename}`;
    const publicPath = path.join("client/public/uploads", filename);
    console.log(`\u{1F4C1} Saving to both: ${tmpPath} and ${publicPath}`);
    await fs.writeFile(tmpPath, processedBuffer);
    await fs.writeFile(publicPath, processedBuffer);
    console.log(`\u{1F4BE} Image saved to both locations`);
    return `/uploads/${filename}`;
  } catch (error) {
    console.error("Error processing image:", error);
    throw new Error("Failed to process image");
  }
}
async function registerRoutes(app2) {
  await storage.cleanupExpiredReservations();
  setInterval(() => {
    storage.cleanupExpiredReservations().catch(console.error);
  }, 5 * 60 * 1e3);
  console.log("\n\u{1F511} API Token for external applications:");
  console.log(`   ${API_TOKEN}`);
  console.log("   Use this token in the Authorization header: 'Bearer <token>'\n");
  app2.post("/api/auth/login", async (req, res) => {
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
  app2.post("/api/auth/logout", async (req, res) => {
    try {
      req.session.destroy((err) => {
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
  app2.get("/api/auth/status", (req, res) => {
    res.json({
      isAuthenticated: !!(req.session && req.session.isAdmin),
      tokenType: req.session && req.session.isAdmin ? "admin" : null
    });
  });
  app2.post("/api/upload", requireAdminAuth, upload.array("images", 8), async (req, res) => {
    try {
      console.log("\u{1F4F8} Upload request received");
      const files = req.files;
      if (!files || files.length === 0) {
        console.log("\u274C No files provided in upload request");
        return res.status(400).json({ error: "No images provided" });
      }
      console.log(`\u{1F4C1} Processing ${files.length} files:`, files.map((f) => f.originalname));
      const imageUrls = [];
      const errors = [];
      for (const file of files) {
        try {
          console.log(`\u{1F504} Processing file: ${file.originalname}`);
          const url = await processImage(file.buffer, file.originalname);
          imageUrls.push(url);
          console.log(`\u2705 Successfully processed: ${file.originalname} -> ${url}`);
        } catch (error) {
          const errorMsg = `Error processing ${file.originalname}: ${error}`;
          console.error("\u274C", errorMsg);
          errors.push(errorMsg);
        }
      }
      if (imageUrls.length === 0) {
        console.error("\u274C Failed to process any images:", errors);
        return res.status(500).json({
          error: "Failed to process any images",
          details: errors
        });
      }
      console.log(`\u{1F389} Upload completed: ${imageUrls.length}/${files.length} images processed successfully`);
      res.json({
        success: true,
        image_urls: imageUrls,
        processed: imageUrls.length,
        total: files.length,
        errors: errors.length > 0 ? errors : void 0
      });
    } catch (error) {
      console.error("\u{1F4A5} Upload error:", error);
      res.status(500).json({ error: "Upload failed", details: String(error) });
    }
  });
  app2.post("/api/agent/draft", requireAdminAuth, async (req, res) => {
    try {
      const { text: text2, image_urls } = req.body;
      if (!image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
        return res.status(400).json({ error: "At least one image URL is required" });
      }
      const systemPrompt = `Du bist ein Experte f\xFCr Secondhand-M\xF6bel und hilfst einer Familie aus M\xFCllheim Dorf, die nach Hongkong umzieht. Alle M\xF6bel und Gegenst\xE4nde m\xFCssen verkauft werden.

KONTEXT:
- Familie zieht von M\xFCllheim Dorf nach Hongkong um
- Alles muss raus - freundliche Preise
- Abholung vor Ort, Bar oder TWINT
- Kein Link in Tutti Texten, keine E-Mail oder Telefonnummer
- Falls Ma\xDFe unsicher sind, Feld leer lassen oder kurze R\xFCckfrage vorschlagen

KATEGORIEN (nur diese verwenden):
furniture, appliances, toys, electronics, decor, kitchen, sports, outdoor, kids_furniture, other

PREISGESTALTUNG:
- Preis in CHF, auf 5 CHF runden
- Als String mit 2 Dezimalstellen (z.B. "120.00")
- Faire, markt\xFCbliche Preise f\xFCr gebrauchte Artikel
- Ber\xFCcksichtige Zustand und Marke

ZUSTAND (nur diese verwenden):
like new, very good, good, fair

TON:
- Kurz, freundlich, klar
- Deutsch (Schweizer Hochdeutsch)
- Ehrlich \xFCber Zustand
- Positiv aber realistisch

Analysiere die Bilder und erstelle ein JSON-Objekt mit GENAU dieser Struktur:
{
  "name": "Produktname (z.B. 'IKEA Kallax Regal wei\xDF')",
  "description": "Kurze Produktbeschreibung f\xFCr internen Gebrauch",
  "price_chf": "120.00",
  "category": "furniture",
  "condition": "good", 
  "dimensions_cm": "80x40x120 (BxTxH)" oder leer lassen wenn unsicher,
  "tutti_title_de": "Eing\xE4ngiger Tutti-Titel",
  "tutti_body_de": "Vollst\xE4ndige Tutti-Beschreibung mit Details zu Zustand, Abholung in M\xFCllheim Dorf, Preis etc."
}

Verwende die Bilder als Hauptinformation und den Text als zus\xE4tzlichen Kontext.`;
      const userContent = [
        {
          type: "text",
          text: text2 ? `Zus\xE4tzliche Informationen: ${text2}` : "Erstelle eine Produktbeschreibung basierend auf den Bildern."
        }
      ];
      for (const imageUrl of image_urls.slice(0, 4)) {
        try {
          const filename = imageUrl.split("/").pop();
          if (!filename) continue;
          const filepath = `/tmp/${filename}`;
          console.log(`\u{1F4D6} Converting image to base64: ${filepath}`);
          const imageBuffer = readFileSync(filepath);
          const base64Image = imageBuffer.toString("base64");
          userContent.push({
            type: "image_url",
            image_url: {
              url: `data:image/webp;base64,${base64Image}`,
              detail: "high"
            }
          });
          console.log(`\u2705 Added base64 image: ${filename} (${imageBuffer.length} bytes)`);
        } catch (err) {
          console.error(`\u274C Failed to process image ${imageUrl}:`, err);
        }
      }
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        // Use GPT-4 with vision capabilities
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
        max_tokens: 1e3,
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
      const validatedCategories = ["furniture", "appliances", "toys", "electronics", "decor", "kitchen", "sports", "outdoor", "kids_furniture", "other"];
      const validatedConditions = ["like new", "very good", "good", "fair"];
      if (!validatedCategories.includes(aiProposal.category)) {
        aiProposal.category = "other";
      }
      if (!validatedConditions.includes(aiProposal.condition)) {
        aiProposal.condition = "good";
      }
      const price = parseFloat(aiProposal.price_chf || "0");
      const roundedPrice = Math.round(price / 5) * 5;
      aiProposal.price_chf = roundedPrice.toFixed(2);
      aiProposal.cover_image_url = image_urls[0];
      aiProposal.gallery_image_urls = image_urls;
      if (!aiProposal.gallery_image_urls.includes(aiProposal.cover_image_url)) {
        aiProposal.gallery_image_urls = [aiProposal.cover_image_url, ...aiProposal.gallery_image_urls];
      }
      const validatedProposal = agentProposalSchema.parse(aiProposal);
      res.json({
        success: true,
        proposal: validatedProposal
      });
    } catch (error) {
      console.error("AI agent error:", error);
      if (error.name === "ZodError") {
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
  app2.get("/api/admin/products", requireAdminAuth, async (req, res) => {
    try {
      const products2 = await storage.getAllProducts();
      res.json(products2);
    } catch (error) {
      console.error("Error fetching admin products:", error);
      res.status(500).json({ error: "Fehler beim Laden der Admin-Produkte" });
    }
  });
  app2.patch("/api/products/:id", requireAdminAuth, async (req, res) => {
    try {
      const updates = req.body;
      const product = await storage.updateProduct(req.params.id, updates);
      res.json({ success: true, product });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Fehler beim Aktualisieren des Produkts" });
    }
  });
  app2.post("/api/products/:id/mark-sold", requireAdminAuth, async (req, res) => {
    try {
      await storage.updateProductAvailability(req.params.id, false);
      res.json({ success: true, message: "Produkt als verkauft markiert" });
    } catch (error) {
      console.error("Error marking product as sold:", error);
      res.status(500).json({ error: "Fehler beim Markieren als verkauft" });
    }
  });
  app2.post("/api/products/:id/toggle-pin", requireAdminAuth, async (req, res) => {
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
      res.status(500).json({ error: "Fehler beim \xC4ndern des Pin-Status" });
    }
  });
  app2.delete("/api/products/:id", requireAdminAuth, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ success: true, message: "Produkt gel\xF6scht" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Fehler beim L\xF6schen des Produkts" });
    }
  });
  app2.get("/api/products", async (req, res) => {
    try {
      const category = req.query.category;
      let products2;
      if (category && category !== "all") {
        products2 = await storage.getProductsByCategory(category);
      } else {
        products2 = await storage.getProducts();
      }
      res.json(products2);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Fehler beim Laden der Produkte" });
    }
  });
  app2.get("/api/products/:id", async (req, res) => {
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
  app2.post("/api/products", requireAuth, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json({
        success: true,
        message: "Produkt erfolgreich erstellt",
        product
      });
    } catch (error) {
      console.error("Error creating product:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Ung\xFCltige Produktdaten",
          details: error.errors
        });
      }
      res.status(500).json({ error: "Fehler beim Erstellen des Produkts" });
    }
  });
  app2.get("/api/info", (req, res) => {
    res.json({
      name: "M\xF6belMarkt API",
      version: "1.0.0",
      endpoints: {
        "GET /api/products": "Liste aller verf\xFCgbaren Produkte",
        "GET /api/products/:id": "Einzelnes Produkt abrufen",
        "POST /api/products": "Neues Produkt erstellen (authentifiziert)",
        "POST /api/products/:id/toggle-pin": "Produkt anpinnen/entpinnen (Admin)",
        "GET /api/faqs": "Liste aller FAQs",
        "POST /api/reservations": "Neue Reservierung erstellen",
        "GET /api/pickup-times": "Verf\xFCgbare Abholzeiten"
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
  app2.get("/api/faqs", async (req, res) => {
    try {
      const faqs2 = await storage.getFaqs();
      res.json(faqs2);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      res.status(500).json({ error: "Fehler beim Laden der FAQs" });
    }
  });
  app2.post("/api/faqs", async (req, res) => {
    try {
      const validatedData = insertFaqSchema.parse(req.body);
      const faq = await storage.createFaq(validatedData);
      res.status(201).json(faq);
    } catch (error) {
      console.error("Error creating FAQ:", error);
      res.status(400).json({ error: "Ung\xFCltige FAQ-Daten" });
    }
  });
  app2.post("/api/reservations", async (req, res) => {
    try {
      const validatedData = insertReservationSchema.parse(req.body);
      const product = await storage.getProductById(validatedData.productId);
      if (!product) {
        return res.status(404).json({ error: "Produkt nicht gefunden" });
      }
      if (!product.isAvailable) {
        return res.status(400).json({ error: "Produkt ist nicht mehr verf\xFCgbar" });
      }
      const reservation = await storage.createReservation(validatedData);
      await storage.updateProductAvailability(validatedData.productId, false);
      res.status(201).json(reservation);
    } catch (error) {
      console.error("Error creating reservation:", error);
      res.status(400).json({ error: "Fehler bei der Reservierung" });
    }
  });
  app2.get("/api/reservations/:id", async (req, res) => {
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
  app2.patch("/api/reservations/:id/status", async (req, res) => {
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
  app2.get("/api/pickup-times", async (req, res) => {
    try {
      const now = /* @__PURE__ */ new Date();
      const availableTimes = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        if (i === 0 && (date.getHours() >= 19 || (date.getDay() === 0 || date.getDay() === 6 && date.getHours() >= 16))) {
          continue;
        }
        const dayOfWeek = date.getDay();
        let timeSlots = [];
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          timeSlots = ["17:00-18:00", "18:00-19:00"];
        } else if (dayOfWeek === 6 || dayOfWeek === 0) {
          timeSlots = ["10:00-11:00", "11:00-12:00", "14:00-15:00", "15:00-16:00"];
        }
        timeSlots.forEach((slot) => {
          const [startTime] = slot.split("-");
          const pickupTime = new Date(date);
          const [hours, minutes] = startTime.split(":").map(Number);
          pickupTime.setHours(hours, minutes, 0, 0);
          if (pickupTime > now) {
            availableTimes.push({
              datetime: pickupTime.toISOString(),
              display: `${date.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "short" })}, ${slot}`,
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
  app2.post("/api/init-sample-data", async (req, res) => {
    try {
      const sampleProducts = [
        {
          name: "Gem\xFCtliches Sofa",
          description: "Bequemes 3-Sitzer Sofa in dunkelgrau, perfekt f\xFCr das Wohnzimmer",
          price: "350.00",
          category: "furniture",
          imageUrls: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=400&fit=crop"]
        },
        {
          name: "K\xFChlschrank",
          description: "Energieeffizienter K\xFChlschrank, 200L Fassungsverm\xF6gen, A++ Energieklasse",
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
      const sampleFaqs = [
        {
          question: "Wie funktioniert die Reservierung?",
          answer: "Sie k\xF6nnen einen Artikel direkt \xFCber die Webseite reservieren. Die Reservierung ist 48 Stunden g\xFCltig.",
          order: 1
        },
        {
          question: "Wann kann ich die Artikel abholen?",
          answer: "Abholzeiten sind Mo-Fr 17:00-19:00 und Sa-So 10:00-16:00. Der genaue Termin wird bei der Reservierung vereinbart.",
          order: 2
        },
        {
          question: "Sind die Preise verhandelbar?",
          answer: "Die Preise sind bereits fair kalkuliert, aber bei Abnahme mehrerer Artikel k\xF6nnen wir gerne sprechen.",
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
  const httpServer = createServer(app2);
  return httpServer;
}

// api/index.ts
var isVercel = !!process.env.VERCEL;
var app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
var PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: "session",
    // Increase pool size for serverless
    pool: {
      max: 2,
      min: 0,
      acquire: 3e4,
      idle: 1e4
    }
  }),
  secret: process.env.SESSION_SECRET || "fallback-secret-key",
  resave: false,
  saveUninitialized: false,
  name: "sessionId",
  cookie: {
    secure: isVercel,
    // HTTPS in production/Vercel
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1e3,
    // 24 hours
    sameSite: "lax"
  }
}));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isVercel && origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});
var server = await registerRoutes(app);
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("API Error:", err);
  res.status(status).json({
    message,
    ...process.env.NODE_ENV === "development" && { stack: err.stack }
  });
});
var index_default = app;
export {
  index_default as default
};
