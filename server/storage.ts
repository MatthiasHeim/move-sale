import { products, faqs, reservations, type Product, type Faq, type Reservation, type InsertProduct, type InsertFaq, type InsertReservation } from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProductAvailability(id: string, isAvailable: boolean): Promise<void>;
  
  // FAQs
  getFaqs(): Promise<Faq[]>;
  createFaq(faq: InsertFaq): Promise<Faq>;
  
  // Reservations
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  getReservationById(id: string): Promise<Reservation | undefined>;
  getReservationsByProduct(productId: string): Promise<Reservation[]>;
  updateReservationStatus(id: string, status: string): Promise<void>;
  cleanupExpiredReservations(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isAvailable, true)).orderBy(desc(products.createdAt));
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(eq(products.category, category), eq(products.isAvailable, true)))
      .orderBy(desc(products.createdAt));
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProductAvailability(id: string, isAvailable: boolean): Promise<void> {
    await db.update(products).set({ isAvailable }).where(eq(products.id, id));
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
}

export const storage = new DatabaseStorage();
