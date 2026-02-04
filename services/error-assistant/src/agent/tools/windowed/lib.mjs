/**
 * Windowed File - manages file viewing with windowed display
 * Similar to SWE-agent's windowed_file.py
 */

import fs from 'fs/promises';
import path from 'path';
import { getRegistry, writeEnv, readEnv } from '../registry.mjs';

const DEFAULT_WINDOW = 50;
const DEFAULT_OVERLAP = 0;

/**
 * File history for undo functionality
 * Similar to SWE-agent's _file_history - tracks previous file contents per path
 * @type {Map<string, string[]>}
 */
const fileHistory = new Map();

/**
 * Get file history for a path
 * @param {string} filePath - Absolute path to the file
 * @returns {string[]} Array of previous file contents (most recent last)
 */
export function getFileHistory(filePath) {
  return fileHistory.get(filePath) || [];
}

/**
 * Save current file content to history before editing
 * @param {string} filePath - Absolute path to the file
 * @param {string} content - Current file content before edit
 */
export function saveToHistory(filePath, content) {
  if (!fileHistory.has(filePath)) {
    fileHistory.set(filePath, []);
  }
  const history = fileHistory.get(filePath);
  // Limit history to prevent memory issues (keep last 10 edits)
  if (history.length >= 10) {
    history.shift();
  }
  history.push(content);
}

/**
 * Pop the last saved content from history (for undo)
 * @param {string} filePath - Absolute path to the file
 * @returns {string | null} Previous file content or null if no history
 */
export function popFromHistory(filePath) {
  const history = fileHistory.get(filePath);
  if (!history || history.length === 0) {
    return null;
  }
  return history.pop();
}

/**
 * Clear file history for a path
 * @param {string} filePath - Absolute path to the file
 */
export function clearHistory(filePath) {
  fileHistory.delete(filePath);
}

export class FileNotOpened extends Error {
  constructor(message = 'No file opened') {
    super(message);
    this.name = 'FileNotOpened';
  }
}

export class TextNotFound extends Error {
  constructor(message = 'Text not found') {
    super(message);
    this.name = 'TextNotFound';
  }
}

export class WindowedFile {
  /**
   * @param {Object} opts
   * @param {string} [opts.path] - Path to file
   * @param {number} [opts.firstLine] - First line of display window
   * @param {number} [opts.window] - Number of lines to display
   * @param {any} [opts.env] - Environment (for registry access)
   * @param {boolean} [opts.exitOnException] - If false, raises exceptions instead of exiting
   */
  constructor(opts = {}) {
    const { path: filePath, firstLine, window, env, exitOnException = true } = opts;
    this.env = env;
    this._exitOnException = exitOnException;
    this._resolvedPath = filePath; // Store path, will resolve from registry in async init
    this._firstLineValue = firstLine;
    this._windowValue = window;
    
    // Store original state for undo
    this._originalText = null;
    this._originalFirstLine = null;
    this._initialized = false;
    this._initPromise = null;
  }

  /**
   * Initialize windowed file (async - loads from registry)
   */
  async _init() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = this._doInit();
    return this._initPromise;
  }

  async _doInit() {
    if (this._initialized) return;
    
    // Get path from registry if not provided
    const registryPath = this.env ? await readEnv(this.env, 'CURRENT_FILE') : null;
    const resolvedPath = this._resolvedPath || registryPath;
    
    if (!resolvedPath) {
      if (this._exitOnException) {
        throw new FileNotOpened('No file open. Use the open command first.');
      }
      throw new FileNotOpened();
    }
    
    // Resolve path relative to cwd if provided
    const cwd = this.env?.cwd || process.cwd();
    this.path = path.isAbsolute(resolvedPath) ? path.resolve(resolvedPath) : path.resolve(cwd, resolvedPath);
    
    // Get window size from registry or use default
    const registryWindow = this.env ? await readEnv(this.env, 'WINDOW') : null;
    this.window = this._windowValue || (registryWindow ? parseInt(registryWindow) : DEFAULT_WINDOW);
    
    const registryOverlap = this.env ? await readEnv(this.env, 'OVERLAP') : null;
    this.overlap = registryOverlap ? parseInt(registryOverlap) : DEFAULT_OVERLAP;
    
    // Set first line (0-indexed)
    const registryFirstLine = this.env ? await readEnv(this.env, 'FIRST_LINE') : null;
    this._firstLine = this._firstLineValue !== undefined ? this._firstLineValue : (registryFirstLine ? parseInt(registryFirstLine) : 0);
    this._firstLine = Math.max(0, this._firstLine);
    this._originalFirstLine = this._firstLine;
    
    this._initialized = true;
  }

  // Reset init promise (for testing/debugging)
  _resetInit() {
    this._initPromise = null;
    this._initialized = false;
  }

  /**
   * Get first line of display window
   */
  get firstLine() {
    return this._firstLine;
  }

  /**
   * Set first line of display window
   */
    set firstLine(value) {
    this._originalFirstLine = this._firstLine;
    const intValue = Math.max(0, Math.floor(value));
    // Will be clamped in getWindowText based on file length
    this._firstLine = intValue;
    if (this.env) {
      writeEnv(this.env, 'FIRST_LINE', this._firstLine.toString()).catch(err => {
        console.warn('[WindowedFile] Failed to save FIRST_LINE:', err.message);
      });
    }
  }

  /**
   * Get file text
   */
  async getText() {
    await this._init();
    try {
      const stats = await fs.stat(this.path);
      if (stats.isDirectory()) {
        throw new Error(`${this.path} is a directory. You can only open files.`);
      }
      return await fs.readFile(this.path, 'utf-8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error(`File ${this.path} not found`);
      }
      throw err;
    }
  }

  /**
   * Set file text
   */
  async setText(newText) {
    this._originalText = await this.getText();
    await fs.writeFile(this.path, newText, 'utf-8');
  }

  /**
   * Get number of lines in file
   */
  async getLineCount() {
    const text = await this.getText();
    return text.split('\n').length;
  }

  /**
   * Get line range for display window
   * @returns {Promise<[number, number]>} [start, end] (0-indexed, inclusive)
   */
  async getLineRange() {
    const nLines = await this.getLineCount();
    const start = this._firstLine;
    const end = Math.min(start + this.window - 1, nLines - 1);
    return [start, end];
  }

  /**
   * Get text in current display window
   * @param {Object} opts
   * @param {boolean} [opts.lineNumbers] - Include line numbers
   * @param {boolean} [opts.statusLine] - Include status line
   * @param {boolean} [opts.prePostLine] - Include pre/post line indicators
   * @returns {Promise<string>}
   */
  async getWindowText(opts = {}) {
    const { lineNumbers = false, statusLine = false, prePostLine = false } = opts;
    const text = await this.getText();
    const lines = text.split('\n');
    const nLines = lines.length;
    
    // Clamp first line to valid range
    this._firstLine = Math.max(0, Math.min(this._firstLine, Math.max(0, nLines - this.window)));
    
    const [start, end] = await this.getLineRange();
    const windowLines = lines.slice(start, end + 1);
    
    const outLines = [];
    
    if (statusLine) {
      outLines.push(`[File: ${this.path} (${nLines} lines total)]`);
    }
    
    if (prePostLine && start > 0) {
      outLines.push(`(${start} more lines above)`);
    }
    
    if (lineNumbers) {
      windowLines.forEach((line, i) => {
        outLines.push(`${start + i + 1}:${line}`);
      });
    } else {
      outLines.push(...windowLines);
    }
    
    if (prePostLine && end < nLines - 1) {
      outLines.push(`(${nLines - end - 1} more lines below)`);
    }
    
    return outLines.join('\n');
  }

  /**
   * Set text in current display window
   * @param {string} newText - New text to replace window with
   * @param {[number, number]} [lineRange] - Optional line range, otherwise uses current window
   */
  async setWindowText(newText, lineRange = null) {
    const text = await this.getText();
    const lines = text.split('\n');
    
    let start, end;
    if (lineRange) {
      [start, end] = lineRange;
    } else {
      [start, end] = await this.getLineRange();
    }
    
    const newLines = newText.split('\n');
    lines.splice(start, end - start + 1, ...newLines);
    
    await this.setText(lines.join('\n'));
  }

  /**
   * Replace text in window
   * @param {string} search - Text to search for
   * @param {string} replace - Text to replace with
   * @param {boolean} [replaceAll] - Replace all occurrences
   * @returns {Promise<{firstReplacedLine: number, nSearchLines: number, nReplaceLines: number, nReplacements: number}>}
   */
  async replaceInWindow(search, replace) {
    const windowText = await this.getWindowText();
    
    // Check if search string is a simple identifier (single word, no special chars except underscore)
    // If so, use word boundaries to avoid replacing substrings within words
    // Pattern: starts with letter/underscore, followed by letters/numbers/underscores only
    const isSimpleIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(search) && !search.includes(' ');
    
    let index;
    let newWindowText;
    
    if (isSimpleIdentifier) {
      // Use word boundaries to match only standalone identifiers
      // \b matches word boundary (between word char [a-zA-Z0-9_] and non-word char)
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedSearch}\\b`);
      const match = windowText.match(regex);
      
      if (!match) {
        throw new TextNotFound(`Text "${search}" not found in displayed lines`);
      }
      
      index = match.index;
      newWindowText = windowText.replace(regex, replace);
    } else {
      // For complex strings (with spaces, special chars, etc.), use exact match
      index = windowText.indexOf(search);
      
      if (index === -1) {
        throw new TextNotFound(`Text "${search}" not found in displayed lines`);
      }
      
      newWindowText = windowText.replace(search, replace);
    }
    
    const [start] = await this.getLineRange();
    const beforeMatch = windowText.substring(0, index);
    const replaceStartLine = start + Math.max(0, beforeMatch.split('\n').length - 1);
    
    await this.setWindowText(newWindowText);
    
    // Move window to replacement location
    this.firstLine = replaceStartLine;
    
    return {
      firstReplacedLine: replaceStartLine,
      nSearchLines: search.split('\n').length,
      nReplaceLines: replace.split('\n').length,
      nReplacements: 1,
    };
  }

  /**
   * Replace text in entire file
   * @param {string} search - Text to search for
   * @param {string} replace - Text to replace with
   * @returns {Promise<{firstReplacedLine: number, nSearchLines: number, nReplaceLines: number, nReplacements: number}>}
   */
  async replace(search, replace) {
    const text = await this.getText();
    
    // Check if search string is a simple identifier (single word, no special chars except underscore)
    // If so, use word boundaries to avoid replacing substrings within words
    // Pattern: starts with letter/underscore, followed by letters/numbers/underscores only
    const isSimpleIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(search) && !search.includes(' ');
    
    let indices;
    let escapedSearch;
    
    if (isSimpleIdentifier) {
      // Use word boundaries to match only standalone identifiers
      // \b matches word boundary (between word char [a-zA-Z0-9_] and non-word char)
      escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedSearch}\\b`, 'g');
      indices = [];
      let match;
      while ((match = regex.exec(text)) !== null) {
        indices.push(match.index);
      }
    } else {
      // For complex strings (with spaces, special chars, etc.), use exact match
      escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedSearch, 'g');
      indices = [];
      let match;
      while ((match = regex.exec(text)) !== null) {
        indices.push(match.index);
      }
    }
    
    if (indices.length === 0) {
      throw new TextNotFound(`Text "${search}" not found in file`);
    }
    
    const replaceStartLine = text.substring(0, indices[0]).split('\n').length - 1;
    
    // Perform replacement
    let newText = text;
    if (isSimpleIdentifier) {
      // Replace with word boundaries
      const regex = new RegExp(`\\b${escapedSearch}\\b`, 'g');
      newText = text.replace(regex, replace);
    } else {
      // Replace exact match
      const regex = new RegExp(escapedSearch, 'g');
      newText = text.replace(regex, replace);
    }
    
    await this.setText(newText);
    
    return {
      firstReplacedLine: replaceStartLine,
      nSearchLines: search.split('\n').length,
      nReplaceLines: replace.split('\n').length,
      nReplacements: indices.length,
    };
  }

  /**
   * Find all occurrences of text
   * @param {string} search - Text to search for
   * @param {boolean} [zeroBased] - Return 0-based line numbers (default: true)
   * @returns {Promise<number[]>}
   */
  async findAllOccurrences(search, zeroBased = true) {
    const text = await this.getText();
    const indices = [];
    let index = 0;
    
    while ((index = text.indexOf(search, index)) !== -1) {
      indices.push(index);
      index += search.length;
    }
    
    const lineNumbers = indices.map(idx => {
      const lineNo = text.substring(0, idx).split('\n').length;
      return zeroBased ? lineNo - 1 : lineNo;
    });
    
    return lineNumbers;
  }

  /**
   * Go to specific line
   * @param {number} lineNumber - Line number (1-based)
   * @param {string} [mode] - 'top' (default), 'middle', 'bottom'
   */
  async goto(lineNumber, mode = 'top') {
    if (typeof lineNumber !== 'number' || lineNumber < 1 || !Number.isInteger(lineNumber)) {
      throw new Error(`Invalid line number: ${lineNumber}. Must be a positive integer.`);
    }
    const nLines = await this.getLineCount();
    const targetLine = Math.max(0, Math.min(lineNumber - 1, nLines - 1)); // Convert to 0-based
    
    if (mode === 'middle') {
      this.firstLine = Math.max(0, targetLine - Math.floor(this.window / 2));
    } else if (mode === 'bottom') {
      this.firstLine = Math.max(0, targetLine - this.window + 1);
    } else {
      this.firstLine = targetLine;
    }
  }

  /**
   * Scroll up
   */
  scrollUp() {
    this.firstLine = Math.max(0, this._firstLine - this.window);
  }

  /**
   * Scroll down
   */
  async scrollDown() {
    const nLines = await this.getLineCount();
    this.firstLine = Math.min(this._firstLine + this.window, Math.max(0, nLines - this.window));
  }

  /**
   * Print current window
   */
  async printWindow() {
    const windowText = await this.getWindowText({ lineNumbers: true, statusLine: true, prePostLine: true });
    console.log(windowText);
    return windowText;
  }

  /**
   * Undo last edit (restore original text)
   */
  async undoEdit() {
    if (this._originalText !== null) {
      await this.setText(this._originalText);
      this._firstLine = this._originalFirstLine;
    }
  }
}
