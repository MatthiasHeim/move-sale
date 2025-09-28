import type { VercelRequest, VercelResponse } from '@vercel/node';
import multer from 'multer';
import sharp from 'sharp';
// @ts-ignore - heic-convert doesn't have types
import heicConvert from 'heic-convert';
import { randomBytes } from 'crypto';
import fs from 'fs/promises';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 8 // Max 8 files
  },
  fileFilter: (req, file, cb) => {
    console.log(`📋 File upload attempt - Name: ${file.originalname}, MIME type: ${file.mimetype || 'undefined'}`);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
    const fileName = file.originalname.toLowerCase();
    const allowedExtensions = ['.jpeg', '.jpg', '.png', '.heic', '.heif'];

    // Check by MIME type first
    if (allowedTypes.includes(file.mimetype)) {
      console.log(`✅ File accepted by MIME type: ${file.mimetype}`);
      cb(null, true);
      return;
    }

    // Check by file extension (important for HEIC files with missing/wrong MIME types)
    if (allowedExtensions.some(ext => fileName.endsWith(ext))) {
      console.log(`✅ File accepted by extension: ${fileName}`);
      cb(null, true);
      return;
    }

    // Handle common edge cases for HEIC files
    if (file.mimetype === 'application/octet-stream' && (fileName.endsWith('.heic') || fileName.endsWith('.heif'))) {
      console.log(`✅ File accepted as HEIC with generic MIME type: ${file.mimetype}`);
      cb(null, true);
      return;
    }

    console.log(`❌ File rejected - Name: ${file.originalname}, MIME: ${file.mimetype}`);
    cb(new Error(`File type not allowed. Got MIME type: ${file.mimetype || 'undefined'}, filename: ${file.originalname}`));
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

    // For Vercel deployment, we'll return a path that can be served statically
    // In production, you might want to upload to a CDN or storage service
    const publicPath = `/uploads/${filename}`;

    // Also save to public uploads directory if it exists (for local dev)
    try {
      await fs.mkdir('./public/uploads', { recursive: true });
      await fs.writeFile(`./public/uploads/${filename}`, processedBuffer);
      console.log(`💾 Image also saved to public/uploads/${filename}`);
    } catch (err) {
      console.log(`⚠️ Could not save to public/uploads (expected in Vercel): ${err}`);
    }

    console.log(`✅ Image processing complete: ${publicPath}`);
    return publicPath;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
}

// Auth check for admin
function requireAdminAuth(req: VercelRequest): boolean {
  // Check for API token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return token === process.env.API_TOKEN;
  }

  // Check for session-based auth (cookie)
  const sessionCookie = req.headers.cookie?.includes('auth-session=authenticated');
  return !!sessionCookie;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  if (!requireAdminAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log("📸 Upload request received on Vercel");

    // Use multer to parse multipart form data
    await new Promise<void>((resolve, reject) => {
      upload.array('images', 8)(req as any, res as any, (err) => {
        if (err) {
          console.error('❌ Multer error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    const files = (req as any).files as Express.Multer.File[];

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
}