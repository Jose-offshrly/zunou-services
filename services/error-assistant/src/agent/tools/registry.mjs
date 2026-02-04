/**
 * Registry tool - manages state (like SWE-agent's registry bundle)
 * Stores state like CURRENT_FILE, etc.
 */

import fs from 'fs/promises';
import path from 'path';

/** @type {Map<string, Map<string, string>>} */
const registryCache = new Map();

/**
 * Get registry for an environment
 * @param {any} env
 * @returns {Map<string, string>}
 */
export function getRegistry(env) {
  const cwd = env.cwd || process.cwd();
  if (!registryCache.has(cwd)) {
    registryCache.set(cwd, new Map());
  }
  return registryCache.get(cwd);
}

/**
 * Read environment variable from registry
 * @param {any} env
 * @param {string} key
 * @returns {Promise<string | null>}
 */
export async function readEnv(env, key) {
  const registry = getRegistry(env);
  return registry.get(key) || null;
}

/**
 * Write environment variable to registry
 * @param {any} env
 * @param {string} key
 * @param {string} value
 * @returns {Promise<void>}
 */
export async function writeEnv(env, key, value) {
  const registry = getRegistry(env);
  registry.set(key, value);
}

/**
 * Registry tool - read/write environment variables
 */
export const registryTool = {
  name: '_read_env',
  signature: '_read_env <key>',
  docstring: 'Read an environment variable from the registry (internal tool)',
  arguments: [
    {
      name: 'key',
      type: 'string',
      description: 'The environment variable key',
      required: true,
    },
  ],
  async execute(env, args) {
    const key = args.key;
    const value = await readEnv(env, key);
    return value || '';
  },
};

// Also provide _write_env tool
export const writeEnvTool = {
  name: '_write_env',
  signature: '_write_env <key> <value>',
  docstring: 'Write an environment variable to the registry (internal tool)',
  arguments: [
    {
      name: 'key',
      type: 'string',
      description: 'The environment variable key',
      required: true,
    },
    {
      name: 'value',
      type: 'string',
      description: 'The environment variable value',
      required: true,
    },
  ],
  async execute(env, args) {
    const key = args.key;
    const value = args.value;
    await writeEnv(env, key, value);
    return `Set ${key}=${value}`;
  },
};
