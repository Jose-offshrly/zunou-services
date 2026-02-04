/**
 * Environment interface: run commands, read/write files. Use createEnv for child_process + fs.
 */

/**
 * @typedef {Object} Env
 * @property {(input: string, opts?: { timeout?: number, check?: 'ignore'|'warn'|'raise' }) => Promise<string>} communicate
 * @property {(path: string, opts?: { encoding?: string }) => Promise<string>} readFile
 * @property {(path: string, content: string) => Promise<void>} writeFile
 * @property {(vars: Record<string,string>) => Promise<void>} setEnvVariables
 * @property {() => Promise<void>} [start]
 * @property {() => Promise<void>} [close]
 * @property {() => Promise<void>} [reset]
 * @property {{ repoName?: string }} [repo]
 */

/**
 * Stub env for tests or when the real backend is not connected.
 * @returns {Env}
 */
export function createStubEnv() {
  return {
    repo: {},
    async communicate(input, _opts) {
      return `stub: ${input}`;
    },
    async readFile(path) {
      return '';
    },
    async writeFile(_path, _content) {},
    async setEnvVariables(_vars) {},
  };
}
