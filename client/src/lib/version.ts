// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-10-04T11:18:25.069Z',
  buildTime: '04.10.2025, 13:18',
  commit: 'b63e3c04cc73e609333047879c2f34a433ddb1d1',
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