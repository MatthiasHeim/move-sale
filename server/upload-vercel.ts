// Vercel-compatible upload handling
// Note: Vercel serverless functions have read-only filesystem except for /tmp
// For production, consider using external storage like S3, Cloudinary, or Vercel Blob

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory in /tmp for serverless environment
const tmpUploadsDir = '/tmp/uploads';
if (!fs.existsSync(tmpUploadsDir)) {
  fs.mkdirSync(tmpUploadsDir, { recursive: true });
}

// Configure multer for temporary storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tmpUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadTmp = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 8, // Max 8 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|heic|heif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and HEIC images are allowed'));
    }
  }
});

// Helper function to clean up temporary files
export function cleanupTmpFiles(files: Express.Multer.File[]) {
  files.forEach(file => {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  });
}

// Note: For production deployment, implement external storage
// Example integration with Vercel Blob:
/*
import { put } from '@vercel/blob';

export async function uploadToBlob(file: Express.Multer.File): Promise<string> {
  const blob = await put(file.filename, file.buffer, {
    access: 'public',
  });
  return blob.url;
}
*/