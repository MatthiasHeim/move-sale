// Load environment variables FIRST before any other imports
// Only load .env file in development - Vercel handles env vars in production
import { config } from "dotenv";
if (process.env.NODE_ENV !== "production") {
  config();
}

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");
console.log("Environment keys:", Object.keys(process.env).filter(k => k.includes('DATABASE')));

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });