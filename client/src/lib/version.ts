// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-10-14T13:53:45.708Z',
  buildTime: '14.10.2025, 15:53',
  commit: '82afe6925aa7fc4ac27b419f955c550e644dc7e7',
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