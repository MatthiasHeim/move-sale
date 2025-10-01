// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-10-01T06:38:53.576Z',
  buildTime: '01.10.2025, 08:38',
  commit: '3c33b660d807b54aa7bdf306334162f7aac0d6b4',
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