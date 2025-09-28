// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-09-28T20:15:32.643Z',
  buildTime: '28.09.2025, 22:15',
  commit: '15768fcbe70c1db195078a13b6de9eccd7164d55',
  version: '1.0.2'
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