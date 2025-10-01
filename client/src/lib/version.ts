// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-10-01T05:41:12.692Z',
  buildTime: '01.10.2025, 07:41',
  commit: 'c8e9f0555301c25fed246b9951688f1662a0af78',
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