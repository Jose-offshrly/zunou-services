/**
 * Env: child_process + fs. cwd = working directory. No git: submit writes a placeholder to model.patch; reset is a no-op.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { parseToolCommand, executeTool, isToolCommand } from '../tools/index.mjs';
import { TOOL_CONFIG, loadTools } from '../tools/config.mjs';
import { getAgentDir } from '../../git.mjs';

const execAsync = promisify(exec);

const SUBMISSION_MARKER = '<<SWE_AGENT_SUBMISSION>>';

// Load tools on module import
let toolsLoaded = false;

/**
 * @param {Object} [opts]
 * @param {string} [opts.cwd] - Working directory for commands (default: process.cwd())
 * @param {string} [opts.repoRoot] - Repo root (for git/PR; default: cwd). Use when cwd is a service subdir (monorepo).
 * @param {string} [opts.submitPatchPath] - Where to write on submit (default: {agentDir}/model.patch)
 * @param {string} [opts.repoName] - For info.repo (default: basename of cwd)
 * @returns {import('../env.mjs').Env & { submitPatchPath: string }}
 */
export function createEnv(opts = {}) {
  const cwd = path.resolve(opts.cwd ?? process.cwd());
  const repoRoot = opts.repoRoot != null ? path.resolve(opts.repoRoot) : cwd;

  // Store model.patch outside the repository (use repo root for agent dir so monorepo works)
  const agentDir = getAgentDir(repoRoot);

  const submitPatchPath =
    opts.submitPatchPath != null
      ? (path.isAbsolute(opts.submitPatchPath) ? opts.submitPatchPath : path.join(agentDir, opts.submitPatchPath))
      : path.join(agentDir, 'model.patch');
  const repoName = opts.repoName ?? path.basename(cwd);

  /** @type {Record<string, string>} */
  let envVars = {};

  /**
   * @param {string} input
   * @param {{ timeout?: number, check?: string }} [runOpts]
   * @returns {Promise<string>}
   */
  async function communicate(input, runOpts = {}) {
    const timeoutMs = (runOpts.timeout ?? 30) * 1000;
    const env = { ...process.env, ...envVars };

    const cmd = (input || '').trim();

    // Check if command is a tool command
    if (isToolCommand(cmd)) {
      try {
        const parsed = parseToolCommand(cmd);
        if (parsed) {
          const envForTools = { ...env, cwd, repoRoot };
          return await executeTool(parsed.name, envForTools, parsed.args);
        }
      } catch (err) {
        // If tool parsing/execution fails, fall through to bash command
        console.warn(`[env] Tool execution failed: ${err.message}, falling back to bash`);
      }
    }
    
    // Handle submit command (special case)
    if (cmd === 'submit' || cmd.startsWith('submit ')) {
      await fs.mkdir(path.dirname(submitPatchPath), { recursive: true }).catch(() => {});
      await fs.writeFile(submitPatchPath, '', 'utf-8').catch(() => {});
      return `${SUBMISSION_MARKER}\n`;
    }

    try {
      // Fix macOS sed -i syntax: macOS requires backup extension (sed -i '' 's/...' or sed -i.bak 's/...')
      // Without it, the first argument is interpreted as backup extension, mangling the path
      let fixedCmd = cmd;
      if (process.platform === 'darwin') {
        const sedWithoutBackup = /^(\s*)sed\s+-i\s+(['"])/;
        if (sedWithoutBackup.test(cmd.trim())) {
          fixedCmd = cmd.replace(/^(\s*)sed\s+-i\s+/, "$1sed -i '' ");
        }
      }
      
      const { stdout, stderr } = await execAsync(fixedCmd, {
        cwd,
        env,
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
      });
      return [stdout, stderr].filter(Boolean).join('\n').trimEnd() || '';
    } catch (e) {
      if (e?.killed && (e?.signal === 'SIGTERM' || e?.signal === 'SIGKILL')) {
        const err = new Error(`Command timed out after ${timeoutMs}ms`);
        err.code = 'ETIMEDOUT';
        throw err;
      }
      const out = (e?.stdout || '') + (e?.stderr || '') + (e?.message || '');
      if (out.trim()) return out.trim();
      throw e;
    }
  }

  async function readFile(filePath, options = {}) {
    const p = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
    const enc = options.encoding ?? 'utf-8';
    return fs.readFile(p, { encoding: enc }).then((b) => (typeof b === 'string' ? b : b.toString(enc)));
  }

  async function writeFile(filePath, content) {
    const p = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
    await fs.mkdir(path.dirname(p), { recursive: true });
    return fs.writeFile(p, content, 'utf-8');
  }

  async function setEnvVariables(vars) {
    envVars = { ...envVars, ...vars };
  }

  async function start() {
    await fs.mkdir(cwd, { recursive: true });
    
    // Load tools if not already loaded
    if (!toolsLoaded) {
      await loadTools();
      toolsLoaded = true;
    }
    
    // Set default environment variables from config
    await setEnvVariables(TOOL_CONFIG.env_variables);
  }

  async function close() {}

  async function reset() {}

  return {
    repo: { repoName },
    submitPatchPath,
    cwd,
    repoRoot,
    communicate,
    readFile,
    writeFile,
    setEnvVariables,
    start,
    close,
    reset,
  };
}
