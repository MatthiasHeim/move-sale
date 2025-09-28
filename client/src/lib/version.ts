// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-09-28T11:45:33.677Z',
  buildTime: '28.09.2025, 13:45',
  commit: 'b9476b7b3c2813c4bf1ad2b5707afd6e4836d9cb',
  version: '1.0.0'
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