// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-09-28T20:06:51.403Z',
  buildTime: '28.09.2025, 22:06',
  commit: 'da46ea1b15309cb42e1de610f125d1f017360fd7',
  version: '1.0.1'
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