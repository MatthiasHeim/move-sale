// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-10-02T05:21:59.993Z',
  buildTime: '02.10.2025, 07:21',
  commit: '38ae3592b42709fba6f6dcea0a6d5d24b0101ce1',
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