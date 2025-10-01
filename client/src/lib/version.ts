// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-10-01T05:35:04.078Z',
  buildTime: '01.10.2025, 07:35',
  commit: '2576fb1ef90aa21893b5cec1842b49357e93c96d',
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