// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-10-01T14:18:10.675Z',
  buildTime: '01.10.2025, 16:18',
  commit: '809234f6774b56f82e72f65d15e2ebb4ad093a9c',
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