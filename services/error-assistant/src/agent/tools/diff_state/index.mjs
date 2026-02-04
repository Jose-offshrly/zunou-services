/**
 * Diff State tool - tracks git diff state
 * Similar to SWE-agent's diff_state bundle
 *
 * NOTE: Uses isomorphic-git only (no system git), and produces a
 * simple, human-readable summary of changed files rather than a
 * full unified diff.
 */

import git from 'isomorphic-git';
import fs from 'fs/promises';
import path from 'path';
import { getAgentDir } from '../../../git.mjs';

/**
 * _state_diff_state - internal tool that updates state.json with git diff
 * This is called automatically by the state system
 */
export const diffStateTool = {
  name: '_state_diff_state',
  signature: '_state_diff_state',
  docstring: 'Internal tool that updates the state with current git diff (automatically called)',
  arguments: [],
  async execute(env, args) {
    const cwd = env.cwd || process.cwd();
    // Store state.json outside the repository
    const agentDir = getAgentDir(cwd);
    await fs.mkdir(agentDir, { recursive: true }).catch(() => {});
    const statePath = path.join(agentDir, 'state.json');
    
    let state = {};
    try {
      const stateContent = await fs.readFile(statePath, 'utf-8');
      state = JSON.parse(stateContent);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.warn(`[diff_state] Failed to read state.json: ${err.message}`);
      }
    }
    
    // Check if we're in a git repository using isomorphic-git
    let repoRoot;
    try {
      repoRoot = await git.findRoot({ fs, filepath: cwd });
    } catch (err) {
      // Not a git repository, set empty diff
      state.diff = '';
      await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf-8');
      return 'Not a git repository. Diff state cleared.';
    }

    // Compute a lightweight diff summary using statusMatrix
    try {
      const matrix = await git.statusMatrix({ fs, dir: repoRoot });

      const lines = [];
      for (const [filepath, headStatus, workdirStatus] of matrix) {
        // headStatus: 0 = absent, 1 = present in HEAD
        // workdirStatus: 0 = absent, 1 = same as HEAD, 2 = different
        if (headStatus === 0 && workdirStatus === 2) {
          // New file
          lines.push(`A ${filepath}`);
        } else if (headStatus === 1 && workdirStatus === 0) {
          // Deleted file
          lines.push(`D ${filepath}`);
        } else if (headStatus === 1 && workdirStatus === 2) {
          // Modified file
          lines.push(`M ${filepath}`);
        }
      }

      state.diff = lines.join('\n');
    } catch (err) {
      console.warn(`[diff_state] Failed to compute diff summary: ${err.message}`);
      state.diff = '';
    }
    
    // Write state back
    await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf-8');
    
    return `Diff state updated (${state.diff ? state.diff.split('\n').length : 0} lines)`;
  },
};

/**
 * Get current state from state.json
 * @param {any} env
 * @returns {Promise<Record<string, any>>}
 */
export async function getState(env) {
  const cwd = env.cwd || process.cwd();
  // Read state.json from agent directory (outside repository)
  const agentDir = getAgentDir(cwd);
  const statePath = path.join(agentDir, 'state.json');
  
  try {
    const stateContent = await fs.readFile(statePath, 'utf-8');
    return JSON.parse(stateContent);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {};
    }
    console.warn(`[diff_state] Failed to read state: ${err.message}`);
    return {};
  }
}
