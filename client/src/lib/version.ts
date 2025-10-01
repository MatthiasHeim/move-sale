// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-10-01T06:43:11.371Z',
  buildTime: '01.10.2025, 08:43',
  commit: 'c7b874f075fcfd5939888fdc70642d19c4d6c61d',
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