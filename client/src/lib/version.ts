// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-10-01T05:47:11.983Z',
  buildTime: '01.10.2025, 07:47',
  commit: 'b76eaf488d15bb4a4ee0ff58018942a7ee76805d',
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