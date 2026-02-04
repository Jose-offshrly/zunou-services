/**
 * Centralized configuration and paths
 */

import path from 'path';

// ============================================================================
// Paths and Workspace Configuration
// ============================================================================

export const WORKSPACE_BASE = '/tmp/workspace';
export const SERVICE = 'api';
export const SERVICE_PATH = 'services/api';
export const BRANCH = 'main';

// ============================================================================
// Service Configuration
// ============================================================================

/**
 * Get service name
 * @returns {string} Service name
 */
export function getServiceName() {
  return SERVICE;
}

/**
 * Get service path relative to repo root. Empty or "." means repo root (not monorepo).
 * @returns {string} Service path (normalized: trimmed, "" or "." → "")
 */
export function getServicePath() {
  const raw = (SERVICE_PATH ?? '').trim().replace(/\/+$/, '');
  return raw === '' || raw === '.' ? '' : raw;
}

/**
 * Get workspace base directory
 * @returns {string} Workspace base path
 */
export function getWorkspaceBase() {
  return WORKSPACE_BASE;
}

/**
 * Get agent directory path
 * @param {string} repoPath - Repository path
 * @returns {string} Agent directory path
 */
export function getAgentDir(repoPath) {
  const normalizedCwd = path.resolve(repoPath);
  if (normalizedCwd.startsWith(WORKSPACE_BASE + path.sep) || normalizedCwd === WORKSPACE_BASE) {
    return path.join(WORKSPACE_BASE, '.agent');
  }
  // Fallback: use parent directory
  return path.join(path.dirname(normalizedCwd), '.agent');
}
