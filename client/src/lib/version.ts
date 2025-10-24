// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-10-18T16:09:25.796Z',
  buildTime: '18.10.2025, 18:09',
  commit: '6cc8982188004449ee465be29e3dd0abf849192d',
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