// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-09-29T13:15:00.000Z',
  buildTime: '29.09.2025, 15:15',
  commit: '5e4f050ce484b21dbh1f954cd1g1362fd0ac062',
  version: '1.0.3'
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