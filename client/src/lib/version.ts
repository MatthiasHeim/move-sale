// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-10-01T07:22:33.316Z',
  buildTime: '01.10.2025, 09:22',
  commit: 'f11845ab4b669ee2e8a573f3e658c007533c5519',
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