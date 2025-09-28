// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-09-28T20:21:13.029Z',
  buildTime: '28.09.2025, 22:21',
  commit: 'fb0c79b4b32ad6695c3de6ac38e6bef329739b03',
  version: '1.0.1'
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