// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-09-30T15:59:45.065Z',
  buildTime: '30.09.2025, 17:59',
  commit: 'beea817eb16ecb65f3226536a5f7e2fad29b9b7c',
  version: '1.0.4'
};

// Function to get a short version string
export function getVersionString(): string {
  const shortCommit = VERSION_INFO.commit.slice(0, 7);
  return `v${VERSION_INFO.version} (${shortCommit})`;
}

// Function to get detailed version info
export function getVersionDetails(): string {
  return `${getVersionString()} - Built: ${VERSION_INFO.buildTime}`;
}