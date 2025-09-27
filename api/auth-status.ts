// Simple auth status endpoint
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Check for session cookie
    const cookies = req.headers.cookie || '';
    const authCookie = cookies.split(';').find(cookie =>
      cookie.trim().startsWith('auth-session=')
    );

    const isAuthenticated = authCookie && authCookie.includes('authenticated');

    res.json({
      isAuthenticated: !!isAuthenticated,
      user: isAuthenticated ? { isAdmin: true } : null
    });
  } catch (error) {
    console.error('Auth status error:', error);
    res.status(500).json({
      error: "Failed to check auth status",
      details: error.message
    });
  }
}