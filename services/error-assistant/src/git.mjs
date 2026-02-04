import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs/promises';
import path from 'path';
import { getGitHubAppToken, getGitHubAppInfo } from './github-app.mjs';
import { BRANCH, WORKSPACE_BASE, getAgentDir, getWorkspaceBase } from './config.mjs';
import { WorkspaceError } from './errors.mjs';

export { getAgentDir };

/**
 * Cleans agent dir and ensures repo is cloned/updated. Throws WorkspaceError on failure.
 * @param {object} env - Loaded env (REPO_URL, GITHUB_APP_*, etc.)
 * @returns {Promise<string>} Repo path
 * @throws {WorkspaceError}
 */
export async function prepareWorkspace(env) {
  console.log('[prepareWorkspace] Preparing workspace...');
  const agentDir = getAgentDir(getWorkspaceBase());
  await fs.rm(agentDir, { recursive: true, force: true }).catch(() => {});
  await fs.mkdir(agentDir, { recursive: true });
  try {
    const repoPath = await ensureRepo({
      repoUrl: env.REPO_URL,
      appId: env.GITHUB_APP_ID,
      installationId: env.GITHUB_INSTALLATION_ID,
      privateKeyPath: env.GITHUB_APP_PRIVATE_KEY_PATH,
      privateKey: env.GITHUB_APP_PRIVATE_KEY,
      githubAppEmail: env.GITHUB_APP_EMAIL,
    });
    console.log('[prepareWorkspace] Workspace ready at', repoPath);
    return repoPath;
  } catch (err) {
    throw new WorkspaceError(err.message);
  }
}

function getRepoName(repoUrl) {
  const match = repoUrl.match(/github\.com\/[^/]+\/([^/]+?)(?:\.git)?\/?$/);
  return match ? match[1] : 'repo';
}

/**
 * Clones or pulls repo at configured branch; returns workspace path.
 * @param {object} params
 * @param {string} params.repoUrl - GitHub repository URL (HTTPS)
 * @param {string} [params.appId] - GitHub App ID
 * @param {string} [params.installationId] - GitHub App Installation ID
 * @param {string} [params.privateKeyPath] - Path to App private key (.pem)
 * @param {string} [params.privateKey] - App private key content
 * @param {string} [params.githubAppEmail] - Git user email (default: process.env.GITHUB_APP_EMAIL or app@noreply.github.com)
 * @returns {Promise<string>} Workspace path
 */
export async function ensureRepo({ repoUrl, appId, installationId, privateKeyPath, privateKey, githubAppEmail }) {
  const branch = BRANCH;
  
  if (!appId || !installationId || !(privateKey || privateKeyPath)) {
    throw new Error('GitHub App credentials required: GITHUB_APP_ID, GITHUB_INSTALLATION_ID, and GITHUB_APP_PRIVATE_KEY');
  }
  
  // Get installation access token from GitHub App
  const accessToken = await getGitHubAppToken({ appId, installationId, privateKeyPath, privateKey });
  
  // Get app info for git user config
  let tokenOwner = null;
  let keyContent = privateKey;
  if (!keyContent && privateKeyPath) {
    const keyPath = path.isAbsolute(privateKeyPath) ? privateKeyPath : path.resolve(process.cwd(), privateKeyPath);
    keyContent = await fs.readFile(keyPath, 'utf-8');
    keyContent = keyContent.replace(/\\n/g, '\n').trim();
  }
  if (keyContent) {
    const appInfo = await getGitHubAppInfo(appId, keyContent);
    if (appInfo) {
      tokenOwner = {
        name: appInfo.name,
        email: githubAppEmail ?? process.env.GITHUB_APP_EMAIL ?? `${appInfo.name}@noreply.github.com`,
      };
    }
  }
  
  const repoName = getRepoName(repoUrl);
  const dir = path.join(WORKSPACE_BASE, repoName);
  
  await fs.mkdir(WORKSPACE_BASE, { recursive: true });
  
  const dirExists = await fs
    .access(dir)
    .then(() => true)
    .catch(() => false);
  
  const isGitRepo = dirExists
    ? await fs
        .access(path.join(dir, '.git'))
        .then(() => true)
        .catch(() => false)
    : false;

  // For GitHub Apps, use x-access-token: prefix for installation tokens
  const authenticatedUrl = repoUrl.replace(/https:\/\/(.*@)?github\.com/, `https://x-access-token:${accessToken}@github.com`);

  if (isGitRepo) {
    if (tokenOwner) {
      await git.setConfig({ fs, dir, path: 'user.name', value: tokenOwner.name });
      await git.setConfig({ fs, dir, path: 'user.email', value: tokenOwner.email });
    }
    // Update remote URL with fresh token (installation tokens expire after ~1 hour)
    await git.setConfig({ fs, dir, path: 'remote.origin.url', value: authenticatedUrl });
    try {
      await git.pull({
        fs,
        http,
        dir,
        ref: branch,
        singleBranch: true,
        remote: 'origin',
        onAuth: () => ({ username: accessToken, password: '' }),
      });
    } catch (err) {
      console.warn('Pull failed, attempting fresh clone:', err.message);
      await fs.rm(dir, { recursive: true, force: true });
      await cloneRepo(authenticatedUrl, branch, dir, accessToken);
      if (tokenOwner) {
        await git.setConfig({ fs, dir, path: 'user.name', value: tokenOwner.name });
        await git.setConfig({ fs, dir, path: 'user.email', value: tokenOwner.email });
      }
    }
  } else {
    if (dirExists) {
      await fs.rm(dir, { recursive: true, force: true });
    }
    await cloneRepo(authenticatedUrl, branch, dir, accessToken);
    if (tokenOwner) {
      await git.setConfig({ fs, dir, path: 'user.name', value: tokenOwner.name });
      await git.setConfig({ fs, dir, path: 'user.email', value: tokenOwner.email });
      console.log(`Git user set to token owner: ${tokenOwner.name} <${tokenOwner.email}>`);
    }
  }

  return dir;
}

async function cloneRepo(authenticatedUrl, branch, dir, token) {
  await git.clone({
    fs,
    http,
    dir,
    url: authenticatedUrl,
    ref: branch,
    singleBranch: true,
    depth: 1,
    onAuth: () => ({ username: token, password: '' }),
  });
}

export async function getTokenOwnerInfo(token) {
  try {
    // First, get user info
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!response.ok) {
      console.warn('Failed to fetch GitHub user info:', response.status);
      return null;
    }
    const user = await response.json();
    
    // Get user emails from /user/emails endpoint (more reliable than /user endpoint for private emails)
    let email = null;
    try {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      
      if (emailsResponse.ok) {
        const emails = await emailsResponse.json();
        
        const primaryEmail = emails.find(e => e.primary && e.verified);
        const verifiedEmail = emails.find(e => e.verified);
        const firstEmail = emails.find(e => e.email);
        
        email = primaryEmail?.email || verifiedEmail?.email || firstEmail?.email || null;
      } else {
        console.warn('[getTokenOwnerInfo] /user/emails endpoint failed:', emailsResponse.status, emailsResponse.statusText);
      }
    } catch (err) {
      console.warn('[getTokenOwnerInfo] Failed to fetch user emails:', err.message);
    }
    
    // Fallback to /user endpoint email, then noreply
    if (!email) {
      email = user.email || `${user.login}@users.noreply.github.com`;
    }
    
    return {
      name: user.login || user.name || 'GitHub User',
      email,
    };
  } catch (err) {
    console.warn('Failed to fetch token owner info:', err.message);
    return null;
  }
}

/**
 * Git user.name and user.email from repo config.
 * @param {string} repoPath - Repository directory path
 * @returns {Promise<{ name: string, email: string } | null>}
 */
export async function getGitUser(repoPath) {
  try {
    const name = await git.getConfig({ fs, dir: repoPath, path: 'user.name' });
    const email = await git.getConfig({ fs, dir: repoPath, path: 'user.email' });
    if (name && email) {
      return { name, email };
    }
    return null;
  } catch {
    return null;
  }
}
