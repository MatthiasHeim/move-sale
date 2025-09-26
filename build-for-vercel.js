#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  console.log('🏗️  Building MöbelMarkt for Vercel...');

  // Build frontend using Vercel-specific config
  console.log('📦 Building frontend with Vite...');
  execSync('npx vite build --config vite.config.vercel.ts', { stdio: 'inherit' });

  // No need to build API - Vercel handles TypeScript compilation
  console.log('⚡ API will be compiled by Vercel...');

  console.log('✅ Build completed successfully!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}