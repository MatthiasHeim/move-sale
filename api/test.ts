// Minimal test endpoint for Vercel serverless function debugging
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.status(200).json({
      message: "Test endpoint working",
      method: req.method,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL ? "SET" : "NOT SET",
        DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
        allEnvKeys: Object.keys(process.env).length
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Test endpoint failed",
      message: error.message
    });
  }
}