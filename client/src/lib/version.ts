// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-09-28T11:52:20.160Z',
  buildTime: '28.09.2025, 13:52',
  commit: '1db567c7f97afeb08287caaa39b3607243e610c0',
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