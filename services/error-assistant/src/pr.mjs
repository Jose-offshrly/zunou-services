/**
 * PR creation tool: checkout branch, commit changes, push, and create PR.
 */

import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs/promises';
import path from 'path';
import { getGitHubAppToken } from './github-app.mjs';
import { BRANCH } from './config.mjs';

/**
 * Create a PR with the current changes.
 * @param {object} params
 * @param {string} params.repoPath - Repository workspace path
 * @param {string} params.branchName - New branch name (e.g. 'fix/pi-not-defined')
 * @param {string} params.commitTitle - Commit message title
 * @param {string} [params.commitDescription] - Commit message body/description
 * @param {string} params.prTitle - PR title
 * @param {string} [params.prDescription] - PR description/body
 * @param {string} params.baseBranch - Base branch to create PR against (default: current branch or 'test/endpoints-for-agent-test')
 * @param {string} params.repoUrl - GitHub repository URL (e.g. https://github.com/user/repo.git)
 * @param {string} [params.token] - GitHub PAT (used if GitHub App not configured)
 * @param {string} [params.appId] - GitHub App ID
 * @param {string} [params.installationId] - GitHub App Installation ID
 * @param {string} [params.privateKeyPath] - Path to GitHub App private key (.pem file)
 * @param {string} [params.privateKey] - GitHub App private key content (alternative to privateKeyPath)
 * @param {string} [params.authorName] - Git author name (from token owner if not provided)
 * @param {string} [params.authorEmail] - Git author email (from token owner if not provided)
 * @returns {Promise<{ success: boolean, branch: string, commit: string, prUrl?: string, prNumber?: number, error?: string }>}
 */
export async function createPR({
  repoPath,
  branchName,
  commitTitle,
  commitDescription = '',
  prTitle,
  prDescription = '',
  baseBranch,
  repoUrl,
  appId,
  installationId,
  privateKeyPath,
  privateKey,
  authorName,
  authorEmail,
}) {
  if (!appId || !installationId || !(privateKey || privateKeyPath)) {
    throw new Error('GitHub App credentials required: GITHUB_APP_ID, GITHUB_INSTALLATION_ID, and GITHUB_APP_PRIVATE_KEY');
  }
  
  // Get installation access token from GitHub App
  const accessToken = await getGitHubAppToken({ appId, installationId, privateKeyPath, privateKey });
  try {
    // Always use configured base branch
    const targetBaseBranch = BRANCH;
    
    let currentBranch;
    try {
      currentBranch = await git.currentBranch({ fs, dir: repoPath, fullname: false });
    } catch {
      currentBranch = BRANCH;
    }
    

    let statusBeforeBranch = await git.statusMatrix({ fs, dir: repoPath });
    let hasChangesBeforeBranch = false;
    const changedFiles = [];
    // Map to store file contents in memory (avoids unreliable isomorphic-git stash)
    const savedFileContents = new Map();
    
    for (const [filepath, headStatus, workdirStatus] of statusBeforeBranch) {
      if ((headStatus === 0 && workdirStatus === 2) || // New file
          (headStatus === 1 && workdirStatus === 2) || // Modified
          (headStatus === 1 && workdirStatus === 0)) {  // Deleted
        hasChangesBeforeBranch = true;
        changedFiles.push({ filepath, headStatus, workdirStatus });
      }
    }
    
    if (!hasChangesBeforeBranch && currentBranch !== targetBaseBranch) {
      console.warn(`[createPR] ⚠️ On different branch (${currentBranch}) than base (${targetBaseBranch}) with no changes - resetting to ${targetBaseBranch}`);
      // Reset to main if we're on a stale branch with no changes (likely from a previous failed PR attempt)
      try {
        await git.checkout({
          fs,
          dir: repoPath,
          ref: targetBaseBranch,
          force: true,
        });
        return {
          success: false,
          branch: branchName,
          commit: '',
          error: `No changes to commit. Was on branch '${currentBranch}' (likely from a previous failed attempt). Reset to '${targetBaseBranch}'. Please make your edits and try again.`,
        };
      } catch (err) {
        console.warn(`[createPR] Failed to reset to ${targetBaseBranch}:`, err.message);
      }
    }
    
    // Save changed file contents to memory before branch switch
    if (hasChangesBeforeBranch) {
      for (const { filepath, workdirStatus } of changedFiles) {
        if (workdirStatus === 2) { // File exists (new or modified)
          try {
            const content = await fs.readFile(path.join(repoPath, filepath));
            savedFileContents.set(filepath, content);
          } catch (err) {
            console.warn(`[createPR] Failed to save ${filepath}:`, err.message);
          }
        } else {
          // Mark deleted files
          savedFileContents.set(filepath, null);
        }
      }
    }

    try {
      await git.checkout({
        fs,
        dir: repoPath,
        ref: targetBaseBranch,
        force: true, // Discard local changes (we have them in memory)
      });
    } catch (err) {
      console.warn(`[createPR] Failed to checkout base branch ${targetBaseBranch}, continuing:`, err.message);
    }

    const branches = await git.listBranches({ fs, dir: repoPath });
    let finalBranchName = branchName;
    
    if (branches.includes(branchName)) {
      const suffix = Date.now().toString(36);
      finalBranchName = `${branchName}-${suffix}`;
    } else {
      try {
        await git.fetch({
          fs,
          http,
          dir: repoPath,
          remote: 'origin',
          ref: branchName,
          singleBranch: true,
          depth: 1,
        });
        const suffix = Date.now().toString(36);
        finalBranchName = `${branchName}-${suffix}`;
      } catch {
        finalBranchName = branchName;
      }
    }
    await git.branch({
      fs,
      dir: repoPath,
      ref: finalBranchName,
      checkout: true,
    });

    // Restore saved file contents after branch switch
    if (savedFileContents.size > 0) {
      for (const [filepath, content] of savedFileContents) {
        const fullPath = path.join(repoPath, filepath);
        try {
          if (content === null) {
            // Delete the file
            await fs.unlink(fullPath);
          } else {
            // Ensure directory exists and write file
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content);
          }
        } catch (err) {
          console.error(`[createPR] Failed to restore ${filepath}:`, err.message);
          return {
            success: false,
            branch: branchName,
            commit: '',
            error: `Failed to restore file changes: ${err.message}`,
          };
        }
      }
    }

    const status = await git.statusMatrix({ fs, dir: repoPath });
    const filesToAdd = [];
    const filesToRemove = [];

    for (const [filepath, headStatus, workdirStatus, stageStatus] of status) {
      if (headStatus === 0 && workdirStatus === 2) {
        filesToAdd.push(filepath);
      } else if (headStatus === 1 && workdirStatus === 2) {
        filesToAdd.push(filepath);
      } else if (headStatus === 1 && workdirStatus === 0) {
        filesToRemove.push(filepath);
      } else if (workdirStatus === 2 && stageStatus !== 2 && stageStatus !== 3) {
        filesToAdd.push(filepath);
      }
    }

    if (filesToAdd.length === 0 && filesToRemove.length === 0) {
      const actualBranch = await git.currentBranch({ fs, dir: repoPath, fullname: false }).catch(() => 'unknown');
      let errorMsg;
      if (hasChangesBeforeBranch && savedFileContents.size > 0) {
        errorMsg = `No changes detected after restoring saved files. Changes may have been lost during branch operations. Current branch: ${actualBranch}, Base branch (target): ${targetBaseBranch}`;
      } else if (hasChangesBeforeBranch) {
        errorMsg = `No changes detected after branch switch. Changes may have been lost during branch operations. Current branch: ${actualBranch}, Base branch (target): ${targetBaseBranch}`;
      } else {
        errorMsg = `No changes to commit. Make sure you have modified files before calling create_pr. Current branch: ${actualBranch}, Base branch (target): ${targetBaseBranch}`;
      }
      
      // Reset to main branch on failure so next attempt starts clean
      try {
        await git.checkout({
          fs,
          dir: repoPath,
          ref: targetBaseBranch,
          force: true,
        });
        console.log(`[createPR] Reset to ${targetBaseBranch} after failure`);
      } catch (resetErr) {
        console.warn(`[createPR] Failed to reset to ${targetBaseBranch}:`, resetErr.message);
      }
      
      return {
        success: false,
        branch: finalBranchName,
        commit: '',
        error: errorMsg,
      };
    }

    for (const file of filesToAdd) {
      try {
        await git.add({ fs, dir: repoPath, filepath: file });
      } catch (err) {
        console.warn(`Failed to add ${file}:`, err.message);
      }
    }

    for (const file of filesToRemove) {
      try {
        await git.remove({ fs, dir: repoPath, filepath: file });
      } catch (err) {
        console.warn(`Failed to remove ${file}:`, err.message);
      }
    }

    const commitMessage = commitDescription
      ? `${commitTitle}\n\n${commitDescription}`
      : commitTitle;

    const commitOid = await git.commit({
      fs,
      dir: repoPath,
      message: commitMessage,
      author: {
        name: authorName || 'GitHub User',
        email: authorEmail || 'noreply@github.com',
      },
    });

    const remoteUrl = await git.getConfig({ fs, dir: repoPath, path: 'remote.origin.url' }).catch(() => null);
    // For GitHub Apps, use x-access-token: prefix for installation tokens
    const authenticatedUrl = (remoteUrl || repoUrl).replace(/https:\/\/(.*@)?github\.com/, `https://x-access-token:${accessToken}@github.com`);
    await git.setConfig({ fs, dir: repoPath, path: 'remote.origin.url', value: authenticatedUrl });

    await git.push({
      fs,
      http,
      dir: repoPath,
      remote: 'origin',
      ref: finalBranchName,
      remoteRef: finalBranchName,
      onAuth: () => ({ username: accessToken, password: '' }),
    });

    const repoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
    if (!repoMatch) {
      return {
        success: false,
        branch: finalBranchName,
        commit: commitOid,
        error: 'Invalid repository URL format',
      };
    }

    const [, owner, repo] = repoMatch;
    const prResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: prTitle,
        body: prDescription || `Fixes error: ${commitTitle}`,
        head: finalBranchName,
        base: BRANCH,
      }),
    });

    if (!prResponse.ok) {
      const errorText = await prResponse.text();
      return {
        success: false,
        branch: finalBranchName,
        commit: commitOid,
        error: `Failed to create PR: ${prResponse.status} ${errorText}`,
      };
    }

    const prData = await prResponse.json();

    return {
      success: true,
      branch: finalBranchName,
      commit: commitOid,
      prUrl: prData.html_url,
      prNumber: prData.number,
    };
  } catch (err) {
    const finalBranch = typeof finalBranchName !== 'undefined' ? finalBranchName : branchName;
    return {
      success: false,
      branch: finalBranch,
      commit: '',
      error: err.message || String(err),
    };
  }
}
