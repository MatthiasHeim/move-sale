// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-09-29T07:36:37.641Z',
  buildTime: '29.09.2025, 09:36',
  commit: 'db64c1cef198bdea85f8c5b1fefe6fd1cf3f571d',
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