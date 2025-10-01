// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-09-30T20:22:00.176Z',
  buildTime: '30.09.2025, 22:22',
  commit: '818798e0a3c7372a5f63b22b0a601f79e0753649',
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