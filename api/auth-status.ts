// Simple auth status endpoint
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Return basic auth status (not logged in for now)
    res.json({
      isAuthenticated: false,
      user: null
    });
  } catch (error) {
    console.error('Auth status error:', error);
    res.status(500).json({
      error: "Failed to check auth status",
      details: error.message
    });
  }
}