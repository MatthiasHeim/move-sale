// Environment detection and configuration
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isVercel = process.env.VERCEL === '1';

// Storage configuration based on environment
export const storageConfig = {
  // In development: use local filesystem
  // In Vercel production: use external storage (Blob, S3, etc.)
  useExternalStorage: isVercel || (isProduction && !isDevelopment),

  // Local paths
  localUploadsDir: 'client/public/uploads',
  tmpDir: '/tmp',

  // External storage settings (configure based on your choice)
  vercelBlob: {
    enabled: false, // Set to true when implementing Vercel Blob
  },
  s3: {
    enabled: false, // Set to true when implementing S3
    bucket: process.env.S3_BUCKET_NAME,
    region: process.env.AWS_REGION,
  },
  cloudinary: {
    enabled: false, // Set to true when implementing Cloudinary
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  }
};

export function getBaseUrl(): string {
  if (isVercel) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const port = process.env.PORT || '5000';
  return `http://localhost:${port}`;
}