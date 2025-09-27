// Admin login endpoint
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    // Check if password is provided
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Check against environment variable
    if (!process.env.ADMIN_PASS) {
      return res.status(500).json({ error: 'Admin password not configured' });
    }

    // Verify password
    if (password === process.env.ADMIN_PASS) {
      // For now, just return success without session management
      return res.json({
        success: true,
        message: 'Login successful',
        user: { isAdmin: true }
      });
    } else {
      return res.status(401).json({ error: 'Invalid password' });
    }

  } catch (error) {
    console.error('Login API error:', error);
    res.status(500).json({
      error: "Login failed",
      details: error.message
    });
  }
}