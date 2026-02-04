import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

/**
 * Generate a JWT token for GitHub App authentication
 * @param {string} appId - GitHub App ID
 * @param {string} privateKey - Private key content (PEM format)
 * @returns {string} JWT token
 */
export function generateJWT(appId, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60, // Issued at time (60 seconds ago to account for clock skew)
    exp: now + 600, // Expires in 10 minutes
    iss: appId, // Issuer (GitHub App ID)
  };

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  sign.end();
  const signature = sign.sign(privateKey, 'base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Get installation access token from GitHub
 * @param {string} jwtToken - JWT token for the GitHub App
 * @param {string} installationId - Installation ID
 * @returns {Promise<string>} Installation access token
 */
async function getInstallationToken(jwtToken, installationId) {
  const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwtToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get installation token: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.token;
}

/**
 * Get GitHub App installation access token
 * @param {object} options
 * @param {string} options.appId - GitHub App ID
 * @param {string} options.installationId - Installation ID
 * @param {string} [options.privateKeyPath] - Path to private key file (.pem)
 * @param {string} [options.privateKey] - Private key content (alternative to privateKeyPath)
 * @returns {Promise<string>} Installation access token
 */
export async function getGitHubAppToken({ appId, installationId, privateKeyPath, privateKey }) {
  if (!appId || !installationId) {
    throw new Error('GITHUB_APP_ID and GITHUB_INSTALLATION_ID are required');
  }

  let keyContent = privateKey;
  if (!keyContent && privateKeyPath) {
    const keyPath = path.isAbsolute(privateKeyPath) ? privateKeyPath : path.resolve(process.cwd(), privateKeyPath);
    keyContent = await fs.readFile(keyPath, 'utf-8');
  }

  if (!keyContent) {
    throw new Error('Either GITHUB_APP_PRIVATE_KEY or GITHUB_APP_PRIVATE_KEY_PATH must be provided');
  }

  // Normalize the private key (handle different formats)
  keyContent = keyContent.replace(/\\n/g, '\n').trim();

  const jwtToken = generateJWT(appId, keyContent);
  const installationToken = await getInstallationToken(jwtToken, installationId);

  return installationToken;
}

/**
 * Get GitHub App installation info (for getting app name/email)
 * @param {string} appId - GitHub App ID
 * @param {string} privateKey - Private key content (PEM format)
 * @returns {Promise<{name: string, email: string} | null>}
 */
export async function getGitHubAppInfo(appId, privateKey) {
  try {
    const jwtToken = generateJWT(appId, privateKey);
    
    // Get app info
    const appResponse = await fetch('https://api.github.com/app', {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!appResponse.ok) {
      return null;
    }

    const appData = await appResponse.json();
    const appName = appData.name || 'GitHub App';
    // Don't generate email - user should configure it separately
    // GitHub Apps don't have a standard email format

    return {
      name: appName,
      email: null, // Email should be configured separately
    };
  } catch (err) {
    console.warn('Failed to fetch GitHub App info:', err.message);
    return null;
  }
}
