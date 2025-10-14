// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-10-05T09:06:38.953Z',
  buildTime: '05.10.2025, 11:06',
  commit: '66a7a875236bf8cfbf8c6bcf31617eb6fa020572',
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