/**
 * Git blame utilities to get original author of a line.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

/**
 * Extract commit hash from git blame output
 * @param {string} blameOutput - Output from git blame
 * @returns {string|null} - Commit hash or null
 */
function extractCommitHash(blameOutput) {
  // git blame output format: <commit-hash> (<author> <date> <line-number>) <line-content>
  // Example: 5bea5560 ("Jose 2026-01-21 15:46:02 +0800 42)     if (firstTs == null) firstTs = e.timestamp;
  // Boundary commits start with ^: ^5dfd050 (Jose-offshrly 2026-01-22 11:07:08 +0800 229)
  // Try to match with or without ^ prefix
  const match = blameOutput.match(/^\^?([a-f0-9]+)\s+/);
  return match ? match[1] : null;
}

/**
 * Get author email from a commit hash
 * @param {string} repoPath - Repository path
 * @param {string} commitHash - Commit hash
 * @returns {Promise<{name: string, email: string} | null>}
 */
async function getAuthorFromCommit(repoPath, commitHash) {
  try {
    // Get author name and email
    const { stdout } = await execAsync(
      `git show ${commitHash} --format="%an|%ae" --no-patch`,
      { cwd: repoPath }
    );
    const [name, email] = stdout.trim().split('|');
    if (name && email) {
      // Strip quotes if present
      const cleanName = name.trim().replace(/^["']|["']$/g, '');
      const cleanEmail = email.trim().replace(/^["']|["']$/g, '');
      return { name: cleanName, email: cleanEmail };
    }
  } catch (err) {
    console.error(`Failed to get author from commit ${commitHash}:`, err.message);
  }
  return null;
}

/**
 * Get original author of a line using git blame
 * @param {string} repoPath - Repository root path
 * @param {string} filePath - File path (relative to repo root)
 * @param {number} lineNumber - Line number (1-based)
 * @param {string} [baseBranch] - Base branch to blame against (default: current branch or HEAD)
 * @returns {Promise<{commit: string, author: {name: string, email: string}, line: string} | null>}
 */
export async function getOriginalAuthor(repoPath, filePath, lineNumber, baseBranch = null) {
  try {
    // Build git blame command
    // Use baseBranch if provided, otherwise blame current branch
    // Format: git blame -L <line>,<line> [branch] -- <file>
    const branchPart = baseBranch ? `${baseBranch} -- ` : '';
    const cmd = `git blame -L ${lineNumber},${lineNumber} ${branchPart}${filePath}`;
    const { stdout, stderr } = await execAsync(cmd, { cwd: repoPath });
    
    if (stderr) {
      console.warn('[git-blame] stderr:', stderr);
    }
    
    const blameOutput = stdout.trim();
    if (!blameOutput) {
      console.warn('[git-blame] No output from git blame');
      return null;
    }
    
    // Extract commit hash
    const commitHash = extractCommitHash(blameOutput);
    if (!commitHash) {
      console.warn(`[git-blame] Could not extract commit hash from blame output: "${blameOutput}"`);
      return null;
    }
    
    // Get author from commit
    const author = await getAuthorFromCommit(repoPath, commitHash);
    if (!author) {
      console.warn('[git-blame] Could not get author from commit');
      return null;
    }
    
    // Extract the actual line content (everything after the date)
    const lineMatch = blameOutput.match(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}[^)]+\)\s+(.+)$/);
    const lineContent = lineMatch ? lineMatch[1] : blameOutput.split(')').slice(-1)[0].trim();
    
    return {
      commit: commitHash,
      author,
      line: lineContent,
    };
  } catch (err) {
    console.error('[git-blame] git blame failed:', err.message);
    return null;
  }
}

/**
 * Extract error location (file and line) from stack trace
 * @param {string|string[]} stackTrace - Stack trace string or array
 * @returns {{file: string, line: number} | null}
 */
export function extractErrorLocation(stackTrace) {
  if (!stackTrace) return null;
  
  const stackLines = Array.isArray(stackTrace) ? stackTrace : [stackTrace];
  
  // Look for patterns like:
  // - "at Runtime.handler (file:///var/task/index.mjs:229:18)" - Lambda handler (PRIORITY)
  // - "at handler (/var/task/index.mjs:229:18)" - Lambda handler
  // - "at Runtime.handleOnceStreaming (file:///var/runtime/index.mjs:1341:38)" - Lambda runtime (IGNORE)
  // - "index.mjs:229:18" - Direct reference
  
  // First pass: Look for /var/task/ paths (handler code, not runtime)
  for (const line of stackLines) {
    // Pattern 1: file:///var/task/index.mjs:229:18 (Lambda handler)
    let match = line.match(/file:\/\/\/var\/task\/([^:]+):(\d+):\d+/);
    if (match) {
      return {
        file: match[1], // e.g., "index.mjs"
        line: parseInt(match[2], 10),
      };
    }
    
    // Pattern 2: /var/task/index.mjs:229:18 (Lambda handler)
    match = line.match(/\/var\/task\/([^:]+):(\d+):\d+/);
    if (match) {
      return {
        file: match[1],
        line: parseInt(match[2], 10),
      };
    }
  }
  
  // Second pass: Look for other file references (but skip /var/runtime/ paths)
  for (const line of stackLines) {
    // Skip Lambda runtime paths
    if (line.includes('/var/runtime/')) {
      continue;
    }
    
    // Pattern 3: Relative or absolute paths (e.g., "index.mjs:229:18" or "./index.mjs:229:18")
    const match = line.match(/(?:at\s+[^\s]+\s+)?(?:\(([^)]+)\)|([^/\s]+\.(mjs|js|ts|tsx|py))):(\d+):\d+/);
    if (match) {
      const filePath = match[1] || match[2]; // Use captured path or filename
      if (filePath && !filePath.includes('/var/runtime/')) {
        // Extract just the filename if it's a full path
        const fileName = filePath.split('/').pop();
        return {
          file: fileName,
          line: parseInt(match[4] || match[3], 10),
        };
      }
    }
  }
  
  return null;
}
