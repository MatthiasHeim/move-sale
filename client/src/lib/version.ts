// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-09-28T19:01:22.361Z',
  buildTime: '28.09.2025, 21:01',
  commit: '5c109720a2932e429a981076634e390500bc5eb8',
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