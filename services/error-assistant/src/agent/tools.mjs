/**
 * Tools: blocklist, shouldBlockAction, checkSubmission, guardMultiline, isRiskyCommand (for confirm-before-run).
 * getState / install / reset are env-dependent; we only define the interface here.
 */

/**
 * Patterns that trigger a confirmation prompt. Only these are considered "risky"; all other
 * commands (sed, npm, touch, mkdir, etc.) run without prompting.
 */
const RISKY_PATTERNS = [
  /\brm\b/i,
  /\brmdir\b/i,
  /\bunlink\b/i,
  /\bdd\b/i,
  /\bmkfs\b/i,
  /\bshred\b/i,
  /\bwipe\b/i,
  /\bchmod\b/i,
  /\bchown\b/i,
  /\bdelete\b/i,
  /:\s*\(\s*\{\s*/,           // fork-bomb–like
  />\s*\/dev\/(sd|nvme|hd)/i,
  /\|\s*sh\b/i,
  /\|\s*bash\b/i,
];

/**
 * True if the command contains a risky pattern (rm, delete, dd, chmod, pipe-to-sh, etc.).
 * Only these trigger confirmBeforeRun; all other commands run without prompting.
 * @param {string} cmd
 * @returns {boolean}
 */
export function isRiskyCommand(cmd) {
  const c = (cmd || '').trim();
  if (!c) return false;
  return RISKY_PATTERNS.some((re) => re.test(c));
}

/** @type {string[]} */
const DEFAULT_BLOCKLIST = [
  'vim', 'vi', 'emacs', 'nano', 'nohup', 'gdb', 'less', 'tail -f', 'python -m venv', 'make',
  'git', 'gh',
];

/** @type {string[]} */
const BLOCKLIST_STANDALONE = [
  'python', 'python3', 'ipython', 'bash', 'sh', '/bin/bash', '/bin/sh', 'nohup', 'vi', 'vim', 'emacs', 'nano', 'su',
  'git', 'gh',
];

const SUBMISSION_MARKER = '<<SWE_AGENT_SUBMISSION>>';

/**
 * @param {string} action
 * @param {{ blocklist?: string[], blocklistStandalone?: string[] }} [config]
 * @returns {boolean}
 */
export function shouldBlockAction(action, config = {}) {
  const a = (action || '').trim();
  if (!a) return false;
  const bl = config.blocklist ?? DEFAULT_BLOCKLIST;
  const stand = config.blocklistStandalone ?? BLOCKLIST_STANDALONE;
  if (bl.some((p) => a.startsWith(p))) return true;
  if (stand.includes(a)) return true;
  const first = a.split(/\s+/)[0];
  if (stand.includes(first)) return true;
  return false;
}

/**
 * @param {string} output
 * @returns {boolean}
 */
export function checkSubmission(output) {
  return typeof output === 'string' && output.includes(SUBMISSION_MARKER);
}

/**
 * Wrap multi-line commands in a heredoc. Simplified: if action contains newlines and matches
 * a known multi-line pattern (e.g. `submit\n...\nEND`), we could wrap; for now we pass through.
 * @param {string} action
 * @param {(s: string) => { name: string, endName?: string } | null} [getFirstMultiline]
 * @returns {string}
 */
export function guardMultiline(action, getFirstMultiline = () => null) {
  const m = getFirstMultiline?.(action);
  if (!m) return action;
  // Placeholder: full heredoc logic can be ported from SWE-agent later
  return action;
}
