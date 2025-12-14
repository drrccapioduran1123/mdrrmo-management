// Shared Google Token Manager for both Sheets and Drive integrations
// This prevents race conditions when multiple API calls need tokens simultaneously

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

interface TokenManager {
  sheets: TokenCache | null;
  drive: TokenCache | null;
  pendingSheets: Promise<string> | null;
  pendingDrive: Promise<string> | null;
}

const tokenManager: TokenManager = {
  sheets: null,
  drive: null,
  pendingSheets: null,
  pendingDrive: null,
};

async function fetchToken(connectorName: 'google-sheet' | 'google-drive'): Promise<string> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken || !hostname) {
    throw new Error('Replit connector environment not available');
  }

  const response = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=${connectorName}`,
    {
      headers: {
        Accept: 'application/json',
        X_REPLIT_TOKEN: xReplitToken,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Connector fetch failed: ${response.status}`);
  }

  const data = await response.json();
  const connectionSettings = data.items?.[0];

  const accessToken =
    connectionSettings?.settings?.access_token ||
    connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error(
      `${connectorName} connector not configured. Please connect it in the integrations panel.`
    );
  }

  // Calculate expiry time (default to 55 minutes if not provided)
  const expiresAt = connectionSettings.settings?.expires_at
    ? new Date(connectionSettings.settings.expires_at).getTime()
    : Date.now() + 55 * 60 * 1000;

  // Store in cache
  if (connectorName === 'google-sheet') {
    tokenManager.sheets = { accessToken, expiresAt };
  } else {
    tokenManager.drive = { accessToken, expiresAt };
  }

  return accessToken;
}

export async function getGoogleSheetsToken(): Promise<string> {
  const now = Date.now();

  // Check if cached token is still valid (with 60 second buffer)
  if (tokenManager.sheets && tokenManager.sheets.expiresAt > now + 60000) {
    return tokenManager.sheets.accessToken;
  }

  // If there's already a pending request, wait for it
  if (tokenManager.pendingSheets) {
    return tokenManager.pendingSheets;
  }

  // Start a new token fetch
  tokenManager.pendingSheets = fetchToken('google-sheet');

  try {
    const token = await tokenManager.pendingSheets;
    return token;
  } finally {
    tokenManager.pendingSheets = null;
  }
}

export async function getGoogleDriveToken(): Promise<string> {
  const now = Date.now();

  // Check if cached token is still valid (with 60 second buffer)
  if (tokenManager.drive && tokenManager.drive.expiresAt > now + 60000) {
    return tokenManager.drive.accessToken;
  }

  // If there's already a pending request, wait for it
  if (tokenManager.pendingDrive) {
    return tokenManager.pendingDrive;
  }

  // Start a new token fetch
  tokenManager.pendingDrive = fetchToken('google-drive');

  try {
    const token = await tokenManager.pendingDrive;
    return token;
  } finally {
    tokenManager.pendingDrive = null;
  }
}

// Export for testing/debugging
export function clearTokenCache(): void {
  tokenManager.sheets = null;
  tokenManager.drive = null;
}
