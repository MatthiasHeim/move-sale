// Minimal API test that uses the same pattern as the main API but simpler
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';

const app = express();
app.use(express.json());

// Simple test route to verify the pattern works
app.get('/api/minimal', (req, res) => {
  res.json({
    message: "Minimal API working",
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
      NODE_ENV: process.env.NODE_ENV
    }
  });
});

export default app;