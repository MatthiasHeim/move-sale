// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-09-29T14:00:00.000Z',
  buildTime: '29.09.2025, 16:00',
  commit: '6f5g160df595c32eci2g065de2h2473ge1bd173',
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