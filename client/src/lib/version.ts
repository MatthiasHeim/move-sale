// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-10-01T06:27:22.778Z',
  buildTime: '01.10.2025, 08:27',
  commit: '9c18873ce07d8d2f872319c02ca8a83e1ae193e2',
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