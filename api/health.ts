// Minimal health check endpoint - no imports, just environment variable diagnostics
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Check all critical environment variables
    const envCheck = {
      DATABASE_URL: {
        exists: !!process.env.DATABASE_URL,
        length: process.env.DATABASE_URL?.length || 0,
        prefix: process.env.DATABASE_URL?.substring(0, 20) || '',
        hasPassword: process.env.DATABASE_URL?.includes('@') || false
      },
      SESSION_SECRET: {
        exists: !!process.env.SESSION_SECRET,
        length: process.env.SESSION_SECRET?.length || 0
      },
      ADMIN_PASS: {
        exists: !!process.env.ADMIN_PASS,
        length: process.env.ADMIN_PASS?.length || 0
      },
      OPENAI_API_KEY: {
        exists: !!process.env.OPENAI_API_KEY,
        length: process.env.OPENAI_API_KEY?.length || 0,
        prefix: process.env.OPENAI_API_KEY?.substring(0, 7) || ''
      },
      SUPABASE_URL: {
        exists: !!process.env.SUPABASE_URL,
        length: process.env.SUPABASE_URL?.length || 0
      },
      SUPABASE_ANON_KEY: {
        exists: !!process.env.SUPABASE_ANON_KEY,
        length: process.env.SUPABASE_ANON_KEY?.length || 0
      }
    };

    const systemInfo = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL ? "SET" : "NOT SET",
      VERCEL_ENV: process.env.VERCEL_ENV,
      timestamp: new Date().toISOString(),
      totalEnvVars: Object.keys(process.env).length,
      envKeysWithDatabase: Object.keys(process.env).filter(k => k.toLowerCase().includes('database')),
      envKeysWithSupabase: Object.keys(process.env).filter(k => k.toLowerCase().includes('supabase'))
    };

    res.status(200).json({
      status: "healthy",
      environment: envCheck,
      system: systemInfo,
      critical: {
        allCriticalVarsPresent: envCheck.DATABASE_URL.exists &&
                               envCheck.SESSION_SECRET.exists &&
                               envCheck.ADMIN_PASS.exists,
        databaseUrlValid: envCheck.DATABASE_URL.exists &&
                         envCheck.DATABASE_URL.length > 50 &&
                         envCheck.DATABASE_URL.hasPassword
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: error.message,
      stack: error.stack
    });
  }
}