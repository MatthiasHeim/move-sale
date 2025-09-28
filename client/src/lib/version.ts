// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-09-28T18:46:20.268Z',
  buildTime: '28.09.2025, 20:46',
  commit: '193cc0e6d0efbfec2ede7ac451add97e40c93d46',
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