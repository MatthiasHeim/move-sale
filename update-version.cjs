#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

try {
  // Get git commit hash
  const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

  // Get current timestamp
  const timestamp = new Date().toISOString();
  const buildTime = new Date().toLocaleString('de-DE', {
    timeZone: 'Europe/Zurich',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Read version file
  const versionPath = './client/src/lib/version.ts';
  let content = fs.readFileSync(versionPath, 'utf8');

  // Update the version info
  content = content.replace(
    /export const VERSION_INFO = \{[\s\S]*?\};/,
    `export const VERSION_INFO = {
  timestamp: '${timestamp}',
  buildTime: '${buildTime}',
  commit: '${commit}',
  version: '1.0.0'
};`
  );

  // Write back to file
  fs.writeFileSync(versionPath, content);

  console.log(`✅ Version updated: ${commit.slice(0, 7)} - ${buildTime}`);

} catch (error) {
  console.warn('⚠️  Could not update version info:', error.message);
  console.log('Continuing with build...');
}