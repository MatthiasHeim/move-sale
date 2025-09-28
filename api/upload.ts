import type { VercelRequest, VercelResponse } from '@vercel/node';
import multer from 'multer';
import sharp from 'sharp';
// @ts-ignore - heic-convert doesn't have types
import heicConvert from 'heic-convert';
import { randomBytes } from 'crypto';
import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file (allow large HEIC files, server will compress)
    files: 8, // Max 8 files
    fieldSize: 50 * 1024 * 1024 // 50MB total payload limit to handle large HEIC files
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
  console.log(`🔄 Processing image: ${originalName} (${buffer.length} bytes)`);

  try {
    let imageBuffer = buffer;

    // Convert HEIC to JPEG if needed with progressive quality reduction
    if (originalName.toLowerCase().endsWith('.heic') || originalName.toLowerCase().endsWith('.heif')) {
      console.log('🔄 Converting HEIC to JPEG with compression...');
      try {
        // Try multiple quality levels for HEIC conversion to manage file size
        let convertedBuffer: Buffer | null = null;
        const targetSizeBytes = 2 * 1024 * 1024; // 2MB target after HEIC conversion

        // Try different quality levels: 0.7, 0.5, 0.3
        const qualityLevels = [0.7, 0.5, 0.3];

        for (const quality of qualityLevels) {
          console.log(`📊 Trying HEIC conversion with quality ${quality}`);

          try {
            const outputBuffer = await heicConvert({
              buffer,
              format: 'JPEG',
              quality
            });

            const convertedSize = outputBuffer.length;
            console.log(`📏 HEIC converted size: ${(convertedSize / 1024 / 1024).toFixed(2)}MB`);

            if (convertedSize <= targetSizeBytes || quality === 0.3) {
              // Accept this quality level (either small enough or last attempt)
              convertedBuffer = Buffer.from(outputBuffer);
              console.log(`✅ HEIC conversion successful with quality ${quality}`);
              break;
            }
          } catch (qualityError) {
            console.warn(`⚠️ HEIC conversion failed at quality ${quality}:`, qualityError);
            continue;
          }
        }

        if (convertedBuffer) {
          imageBuffer = convertedBuffer;
          console.log('✅ HEIC conversion completed');
        } else {
          throw new Error('All HEIC conversion attempts failed');
        }
      } catch (heicError) {
        console.error('❌ HEIC conversion failed completely:', heicError);
        throw new Error(`HEIC conversion failed: ${heicError instanceof Error ? heicError.message : String(heicError)}`);
      }
    }

    // Process with Sharp: rotate, resize, convert to WebP with adaptive quality
    console.log('🔄 Processing with Sharp...');
    let processedBuffer: Buffer;

    try {
      // Start with good quality and reduce if needed
      let quality = 82;
      let attempts = 0;
      const maxAttempts = 3;
      const targetSizeBytes = 1.5 * 1024 * 1024; // 1.5MB target

      do {
        attempts++;
        console.log(`📊 Sharp attempt ${attempts} with quality ${quality}`);

        processedBuffer = await sharp(imageBuffer)
          .rotate() // Auto-rotate based on EXIF
          .resize({
            width: 1600,
            height: 1600,
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality })
          .toBuffer();

        console.log(`📏 Result size: ${(processedBuffer.length / 1024 / 1024).toFixed(2)}MB`);

        // If still too large and we have more attempts, reduce quality
        if (processedBuffer.length > targetSizeBytes && attempts < maxAttempts) {
          quality = Math.max(60, quality - 15); // Reduce quality, minimum 60
          console.log(`🔽 File still large, reducing quality to ${quality}`);
        } else {
          break;
        }
      } while (attempts < maxAttempts);

      console.log(`✅ Sharp processing complete after ${attempts} attempts (${(processedBuffer.length / 1024 / 1024).toFixed(2)}MB)`);
    } catch (sharpError) {
      console.error('❌ Sharp processing failed:', sharpError);
      console.log('⚠️ Using original image buffer as fallback');
      processedBuffer = imageBuffer;
    }

    // Generate unique filename based on whether Sharp processing succeeded
    const isWebP = processedBuffer !== imageBuffer;
    const extension = isWebP ? 'webp' : (originalName.split('.').pop()?.toLowerCase() || 'jpg');
    const filename = `product-${Date.now()}-${randomBytes(8).toString('hex')}.${extension}`;

    console.log(`📝 Generated filename: ${filename} (Sharp processing: ${isWebP ? 'success' : 'fallback'})`);

    // Save to /tmp for AI processing
    const tmpPath = `/tmp/${filename}`;
    try {
      await fs.writeFile(tmpPath, processedBuffer);
      console.log(`💾 Image saved to ${tmpPath} for AI processing`);
    } catch (tmpError) {
      console.error('⚠️ Failed to save to /tmp:', tmpError);
      // Continue anyway - this is not critical for Supabase upload
    }

    // Upload to Supabase Storage for production serving
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!
      );

      // Determine content type based on file extension
      const contentType = isWebP ? 'image/webp' : `image/${extension}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(`uploads/${filename}`, processedBuffer, {
          contentType,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Supabase upload error:', error);
        throw error;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(`uploads/${filename}`);

      const publicUrl = urlData.publicUrl;
      console.log(`✅ Image uploaded to Supabase: ${publicUrl}`);
      return publicUrl;

    } catch (supabaseError: any) {
      console.error('❌ Failed to upload to Supabase:', supabaseError);

      // Check if it's a bucket not found error
      if (supabaseError.message?.includes('bucket') || supabaseError.message?.includes('does not exist')) {
        console.error('🚨 Supabase "images" bucket not found. Please create it manually:');
        console.error('   1. Go to Supabase Dashboard > Storage');
        console.error('   2. Create bucket named "images" with public access');
        console.error('   3. Set up RLS policies for uploads');
        console.error('   4. See SUPABASE_SETUP.md for detailed instructions');
      }

      // Enhanced fallback: Return a placeholder URL that indicates the issue
      // This prevents the entire upload from failing
      const placeholderUrl = `https://via.placeholder.com/400x400/cccccc/666666?text=Image+Upload+Failed`;
      console.log(`⚠️ Using placeholder image due to Supabase error`);

      // Still save to temp for AI processing even if Supabase fails
      console.log(`💾 Image still available at ${tmpPath} for AI processing`);

      return placeholderUrl;
    }
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