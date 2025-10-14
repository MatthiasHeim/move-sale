// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-10-14T14:34:13.264Z',
  buildTime: '14.10.2025, 16:34',
  commit: '34745ac5d744f23c3ec59230f3a0c75496a2e779',
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