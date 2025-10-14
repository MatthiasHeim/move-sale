// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-10-14T12:44:27.034Z',
  buildTime: '14.10.2025, 14:44',
  commit: '245972ef98689ace8f3651e337a7a607056676bf',
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