import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(), // "furniture", "equipment", "decor"
  imageUrls: text("image_urls").array().notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const faqs = pgTable("faqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const reservations = pgTable("reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  pickupTime: timestamp("pickup_time").notNull(),
  status: text("status").default("pending").notNull(), // "pending", "confirmed", "completed", "cancelled"
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const productTexts = pgTable("product_texts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id, { onDelete: 'cascade' }).notNull(),
  tuttiTitleDe: text("tutti_title_de").notNull(),
  tuttiBodyDe: text("tutti_body_de").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const drafts = pgTable("drafts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  images: text("images").array().notNull(),
  rawInput: text("raw_input"),
  proposal: jsonb("proposal"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
}).extend({
  imageUrls: z.array(z.string().url("Each image must be a valid URL")).min(1, "At least one image URL is required"),
});

export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdAt: true,
});

export const insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
  createdAt: true,
  expiresAt: true,
}).extend({
  pickupTime: z.string().transform((str) => new Date(str))
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type Faq = typeof faqs.$inferSelect;

export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservations.$inferSelect;

export const insertProductTextSchema = createInsertSchema(productTexts).omit({
  id: true,
  createdAt: true,
});

export const insertDraftSchema = createInsertSchema(drafts).omit({
  id: true,
  createdAt: true,
});

export type InsertProductText = z.infer<typeof insertProductTextSchema>;
export type ProductText = typeof productTexts.$inferSelect;

export type InsertDraft = z.infer<typeof insertDraftSchema>;
export type Draft = typeof drafts.$inferSelect;

// AI Agent proposal schema
export const agentProposalSchema = z.object({
  name: z.string(),
  description: z.string(),
  price_chf: z.string().regex(/^\d+\.\d{2}$/, "Price must be in format XX.XX"),
  category: z.enum(["furniture", "appliances", "toys", "electronics", "decor", "kitchen", "sports", "outdoor", "kids_furniture", "other"]),
  condition: z.enum(["like new", "very good", "good", "fair"]),
  dimensions_cm: z.string().optional(),
  cover_image_url: z.string().url(),
  gallery_image_urls: z.array(z.string().url()),
  tutti_title_de: z.string(),
  tutti_body_de: z.string(),
});

export type AgentProposal = z.infer<typeof agentProposalSchema>;
