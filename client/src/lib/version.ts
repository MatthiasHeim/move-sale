// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-09-28T19:11:21.587Z',
  buildTime: '28.09.2025, 21:11',
  commit: '8e96e754219e3735b78733d0d738d391bb8c6ae3',
  version: '1.0.0'
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