// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-10-02T05:14:10.252Z',
  buildTime: '02.10.2025, 07:14',
  commit: 'ab600e1aa04c0cf4b1a7d3260ba5c2b5bdb4daee',
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