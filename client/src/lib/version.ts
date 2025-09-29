// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-09-29T07:26:51.525Z',
  buildTime: '29.09.2025, 09:26',
  commit: '636a7b069b86949d01cb5d18f3a3f3a75775153b',
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