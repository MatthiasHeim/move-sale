import sharp from "sharp";
// @ts-ignore - heic-convert doesn't have types
import heicConvert from "heic-convert";
import { randomBytes } from "crypto";
import fs from "fs/promises";

// Vercel-compatible image processing
// Note: For production, integrate with external storage like Vercel Blob, S3, or Cloudinary

export async function processImageForVercel(buffer: Buffer, originalName: string): Promise<{
  filename: string;
  buffer: Buffer;
  tmpPath: string;
}> {
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

    // Save to /tmp for temporary processing
    const tmpPath = `/tmp/${filename}`;
    await fs.writeFile(tmpPath, processedBuffer);

    console.log(`💾 Image processed and saved to: ${tmpPath}`);

    return {
      filename,
      buffer: processedBuffer,
      tmpPath
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
}

// Helper to clean up temporary files
export async function cleanupTmpFile(tmpPath: string): Promise<void> {
  try {
    await fs.unlink(tmpPath);
    console.log(`🗑️ Cleaned up: ${tmpPath}`);
  } catch (error) {
    console.error('Error cleaning up temp file:', error);
  }
}

// Example integration with external storage
// Uncomment and implement based on your chosen storage solution

/*
// Vercel Blob example
import { put } from '@vercel/blob';

export async function uploadToVercelBlob(filename: string, buffer: Buffer): Promise<string> {
  const blob = await put(filename, buffer, {
    access: 'public',
    contentType: 'image/webp'
  });
  return blob.url;
}

// AWS S3 example
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

export async function uploadToS3(filename: string, buffer: Buffer): Promise<string> {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: `uploads/${filename}`,
    Body: buffer,
    ContentType: 'image/webp',
    ACL: 'public-read'
  };

  const result = await s3.upload(params).promise();
  return result.Location;
}

// Cloudinary example
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function uploadToCloudinary(filename: string, buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        public_id: filename.replace('.webp', ''),
        format: 'webp'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    ).end(buffer);
  });
}
*/