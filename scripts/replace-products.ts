import { config } from "dotenv";
config();

import { db } from "../server/db";
import { products, reservations } from "@shared/schema";
import fs from "fs";
import path from "path";

async function replaceProducts() {
  try {
    console.log("🗑️ Deleting all existing reservations...");

    // Delete all reservations first
    await db.delete(reservations);
    console.log("✅ All existing reservations deleted");

    console.log("🗑️ Deleting all existing products...");

    // Delete all existing products
    await db.delete(products);
    console.log("✅ All existing products deleted");

    console.log("📖 Reading products.json...");

    // Read the products.json file
    const productsJsonPath = path.join(process.cwd(), "products.json");
    const productsData = JSON.parse(fs.readFileSync(productsJsonPath, "utf8"));

    console.log(`📦 Found ${productsData.length} products to import`);

    // Transform and insert each product
    for (const product of productsData) {
      // Transform image URLs from /objects/uploads/ to /uploads/
      const transformedImageUrls = product.image_urls.map((url: string) =>
        url.replace("/objects/uploads/", "/uploads/")
      );

      const newProduct = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        imageUrls: transformedImageUrls,
        isAvailable: product.is_available,
        isPinned: false, // Default to not pinned
        createdAt: new Date(product.created_at),
      };

      await db.insert(products).values(newProduct);
      console.log(`✅ Imported: ${product.name}`);
    }

    console.log(`🎉 Successfully imported ${productsData.length} products!`);

  } catch (error) {
    console.error("❌ Error replacing products:", error);
    process.exit(1);
  }
}

replaceProducts().then(() => {
  console.log("✨ Product replacement completed!");
  process.exit(0);
});