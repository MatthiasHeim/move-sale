import { config } from "dotenv";
config();

import fs from "fs";
import path from "path";
import { uploadImageToSupabase } from "../server/supabase";

interface ImageMapping {
  filename: string;
  supabaseUrl: string;
}

async function uploadImagesToSupabase() {
  try {
    console.log("🚀 Starting image upload to Supabase...");

    const imagesDir = path.join(process.cwd(), "images");

    // Check if images directory exists
    if (!fs.existsSync(imagesDir)) {
      throw new Error("Images directory not found");
    }

    // Get all .webp files
    const imageFiles = fs.readdirSync(imagesDir).filter(file => file.endsWith('.webp'));
    console.log(`📦 Found ${imageFiles.length} images to upload`);

    const mappings: ImageMapping[] = [];

    // Upload each image to Supabase
    for (let i = 0; i < imageFiles.length; i++) {
      const filename = imageFiles[i];
      const filePath = path.join(imagesDir, filename);

      console.log(`⬆️  Uploading ${i + 1}/${imageFiles.length}: ${filename}`);

      try {
        // Read the file as buffer
        const fileBuffer = fs.readFileSync(filePath);

        // Upload to Supabase with the original filename
        const supabaseUrl = await uploadImageToSupabase(filename, fileBuffer, "image/webp");

        // Store the mapping
        mappings.push({
          filename,
          supabaseUrl
        });

        console.log(`✅ Uploaded: ${filename} → ${supabaseUrl}`);

        // Add a small delay to avoid overwhelming Supabase
        if (i < imageFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`❌ Failed to upload ${filename}:`, error);
        // Continue with other files even if one fails
      }
    }

    // Save the mapping to a JSON file
    const mappingFile = path.join(process.cwd(), "image-mappings.json");
    fs.writeFileSync(mappingFile, JSON.stringify(mappings, null, 2));

    console.log(`\n📊 Upload Summary:`);
    console.log(`✅ Successfully uploaded: ${mappings.length}/${imageFiles.length} images`);
    console.log(`💾 Mapping saved to: ${mappingFile}`);

    if (mappings.length < imageFiles.length) {
      console.log(`⚠️  ${imageFiles.length - mappings.length} images failed to upload`);
    }

  } catch (error) {
    console.error("❌ Error uploading images:", error);
    process.exit(1);
  }
}

uploadImagesToSupabase().then(() => {
  console.log("🎉 Image upload process completed!");
  process.exit(0);
});