// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-09-29T12:45:00.000Z',
  buildTime: '29.09.2025, 14:45',
  commit: '4d3e040bd373a10cag0e843bc0f0251ec99d951',
  version: '1.0.2'
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