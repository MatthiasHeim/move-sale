// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-09-28T20:36:05.000Z',
  buildTime: '28.09.2025, 22:36',
  commit: '3c2d039ac262909baf8d9732abf9d05014bb3850',
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