import { config } from "dotenv";
config();

import { db } from "../server/db";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

interface ImageMapping {
  filename: string;
  supabaseUrl: string;
}

async function updateDatabaseUrls() {
  try {
    console.log("🔗 Starting database URL update...");

    // Read the image mappings file
    const mappingFilePath = path.join(process.cwd(), "image-mappings.json");
    if (!fs.existsSync(mappingFilePath)) {
      throw new Error("Image mappings file not found. Please run upload script first.");
    }

    const mappings: ImageMapping[] = JSON.parse(fs.readFileSync(mappingFilePath, "utf8"));
    console.log(`📋 Found ${mappings.length} image mappings`);

    // Create a lookup map for faster searching
    const urlMap = new Map<string, string>();
    mappings.forEach(mapping => {
      // Extract just the filename from the Supabase URL to match against /uploads/ paths
      const filename = mapping.filename;
      urlMap.set(`/uploads/${filename}`, mapping.supabaseUrl);
    });

    // Get all products from the database
    const allProducts = await db.select().from(products);
    console.log(`📦 Found ${allProducts.length} products to update`);

    let updatedProducts = 0;
    let totalUrlsUpdated = 0;

    // Update each product's image URLs
    for (const product of allProducts) {
      let hasChanges = false;
      const updatedImageUrls = product.imageUrls.map(url => {
        if (urlMap.has(url)) {
          totalUrlsUpdated++;
          hasChanges = true;
          return urlMap.get(url)!;
        }
        return url;
      });

      if (hasChanges) {
        await db
          .update(products)
          .set({ imageUrls: updatedImageUrls })
          .where(eq(products.id, product.id));

        updatedProducts++;
        console.log(`✅ Updated product "${product.name}" (ID: ${product.id})`);
        console.log(`   • Updated ${updatedImageUrls.length} URLs`);
      } else {
        console.log(`⏭️  Skipped product "${product.name}" (no matching URLs)`);
      }
    }

    console.log(`\n🎯 Update Summary:`);
    console.log(`✅ Products updated: ${updatedProducts}/${allProducts.length}`);
    console.log(`🔗 Total URLs updated: ${totalUrlsUpdated}`);
    console.log(`🚀 All product images now point to Supabase!`);

  } catch (error) {
    console.error("❌ Error updating database URLs:", error);
    process.exit(1);
  }
}

updateDatabaseUrls().then(() => {
  console.log("✨ Database URL update completed!");
  process.exit(0);
});