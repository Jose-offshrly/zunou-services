/**
 * Resolve a path and ensure it stays within the agent workspace (env.cwd).
 * Used by file tools to reject .. escapes and absolute paths outside workspace.
 */

import path from 'path';

/**
 * Resolve path relative to workspace and ensure it is under env.cwd.
 * @param {{ cwd: string }} env - Must have env.cwd (workspace root)
 * @param {string} pathInput - Relative or absolute path
 * @returns {{ resolved: string } | { error: string }}
 */
export function resolveWithinWorkspace(env, pathInput) {
  const workspaceRoot = path.resolve(env.cwd || process.cwd());
  const resolved = path.resolve(workspaceRoot, pathInput || '.');
  const normalizedRoot = workspaceRoot + path.sep;
  if (resolved !== workspaceRoot && !resolved.startsWith(normalizedRoot)) {
    return { error: 'Path outside workspace. Only paths within the workspace are allowed.' };
  }
  return { resolved };
}
