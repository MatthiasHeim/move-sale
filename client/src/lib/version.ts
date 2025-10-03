// Simple version tracking
export const VERSION_INFO = {
  timestamp: '2025-10-03T06:42:32.151Z',
  buildTime: '03.10.2025, 08:42',
  commit: '0b84d9ba95e78a3aee14e206b35f80ccfd5394ce',
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