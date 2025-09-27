import { products, faqs, reservations, productTexts, drafts, type Product, type Faq, type Reservation, type ProductText, type Draft, type InsertProduct, type InsertFaq, type InsertReservation, type InsertProductText, type InsertDraft } from "../shared/schema";
import { db } from "./db";
import { eq, desc, asc, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>; // Admin version - shows all products
  getProductsByCategory(category: string): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product>;
  updateProductAvailability(id: string, isAvailable: boolean): Promise<void>;
  updateProductPinnedStatus(id: string, isPinned: boolean): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  
  // FAQs
  getFaqs(): Promise<Faq[]>;
  createFaq(faq: InsertFaq): Promise<Faq>;
  
  // Reservations
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  getReservationById(id: string): Promise<Reservation | undefined>;
  getReservationsByProduct(productId: string): Promise<Reservation[]>;
  updateReservationStatus(id: string, status: string): Promise<void>;
  cleanupExpiredReservations(): Promise<void>;
  
  // Product Texts (Tutti archive)
  createProductText(productText: InsertProductText): Promise<ProductText>;
  getProductTextsByProductId(productId: string): Promise<ProductText[]>;
  
  // Drafts
  createDraft(draft: InsertDraft): Promise<Draft>;
  getDraftById(id: string): Promise<Draft | undefined>;
  getDrafts(): Promise<Draft[]>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isAvailable, true)).orderBy(desc(products.isPinned), desc(products.createdAt));
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(eq(products.category, category), eq(products.isAvailable, true)))
      .orderBy(desc(products.isPinned), desc(products.createdAt));
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.isPinned), desc(products.createdAt));
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return product;
  }

  async updateProductAvailability(id: string, isAvailable: boolean): Promise<void> {
    await db.update(products).set({ isAvailable }).where(eq(products.id, id));
  }

  async updateProductPinnedStatus(id: string, isPinned: boolean): Promise<void> {
    await db.update(products).set({ isPinned }).where(eq(products.id, id));
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getFaqs(): Promise<Faq[]> {
    return await db.select().from(faqs).orderBy(asc(faqs.order));
  }

  async createFaq(insertFaq: InsertFaq): Promise<Faq> {
    const [faq] = await db.insert(faqs).values(insertFaq).returning();
    return faq;
  }

  async createReservation(insertReservation: InsertReservation): Promise<Reservation> {
    // Set expiration to 48 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);
    
    const [reservation] = await db.insert(reservations).values({
      ...insertReservation,
      expiresAt,
    }).returning();
    return reservation;
  }

  async getReservationById(id: string): Promise<Reservation | undefined> {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation || undefined;
  }

  async getReservationsByProduct(productId: string): Promise<Reservation[]> {
    return await db.select().from(reservations)
      .where(eq(reservations.productId, productId))
      .orderBy(desc(reservations.createdAt));
  }

  async updateReservationStatus(id: string, status: string): Promise<void> {
    await db.update(reservations).set({ status }).where(eq(reservations.id, id));
  }

  async cleanupExpiredReservations(): Promise<void> {
    // Find expired reservations and mark their products as available again
    const expiredReservations = await db.select()
      .from(reservations)
      .where(and(
        eq(reservations.status, "pending"),
        sql`${reservations.expiresAt} < now()`
      ));

    for (const reservation of expiredReservations) {
      await db.update(reservations)
        .set({ status: "expired" })
        .where(eq(reservations.id, reservation.id));
      
      await db.update(products)
        .set({ isAvailable: true })
        .where(eq(products.id, reservation.productId));
    }
  }

  // Product Texts (Tutti archive)
  async createProductText(productText: InsertProductText): Promise<ProductText> {
    const [text] = await db.insert(productTexts).values(productText).returning();
    return text;
  }

  async getProductTextsByProductId(productId: string): Promise<ProductText[]> {
    return await db.select().from(productTexts)
      .where(eq(productTexts.productId, productId))
      .orderBy(desc(productTexts.createdAt));
  }

  // Drafts
  async createDraft(draft: InsertDraft): Promise<Draft> {
    const [newDraft] = await db.insert(drafts).values(draft).returning();
    return newDraft;
  }

  async getDraftById(id: string): Promise<Draft | undefined> {
    const [draft] = await db.select().from(drafts).where(eq(drafts.id, id));
    return draft || undefined;
  }

  async getDrafts(): Promise<Draft[]> {
    return await db.select().from(drafts).orderBy(desc(drafts.createdAt));
  }
}

export const storage = new DatabaseStorage();
