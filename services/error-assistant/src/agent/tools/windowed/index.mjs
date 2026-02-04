/**
 * Windowed tools - file navigation and viewing
 * Similar to SWE-agent's windowed bundle
 */

import path from 'path';
import fs from 'fs/promises';
import { WindowedFile, FileNotOpened } from './lib.mjs';
import { writeEnv, readEnv } from '../registry.mjs';
import { resolveWithinWorkspace } from '../resolve-within-workspace.mjs';

const DEFAULT_WINDOW = 50;

/**
 * open tool - opens a file in windowed view
 */
export const openTool = {
  name: 'open',
  signature: 'open "<path>" [<line_number>]',
  docstring: 'Opens the file at the given path in the editor. If line_number is provided, the window will be moved to include that line',
  arguments: [
    {
      name: 'path',
      type: 'string',
      description: 'The path to the file to open',
      required: true,
    },
    {
      name: 'line_number',
      type: 'integer',
      description: 'The line number to move the window to (if not provided, the window will start at the top of the file)',
      required: false,
    },
  ],
  async execute(env, args) {
    let filePath = args.path;
    // Strip quotes if present
    if ((filePath.startsWith('"') && filePath.endsWith('"')) || 
        (filePath.startsWith("'") && filePath.endsWith("'"))) {
      filePath = filePath.slice(1, -1);
    }
    const lineNumber = args.line_number ? parseInt(args.line_number) : null;
    const pathResult = resolveWithinWorkspace(env, filePath);
    if (pathResult.error) return pathResult.error;
    const resolvedPath = pathResult.resolved;

    try {
      const stats = await fs.stat(resolvedPath);
      if (stats.isDirectory()) {
        return `Error: ${resolvedPath} is a directory. You can only open files. Use cd or ls to navigate directories.`;
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        return `Error: File ${resolvedPath} not found`;
      }
      throw err;
    }
    
    // Store current file in registry
    await writeEnv(env, 'CURRENT_FILE', resolvedPath);
    
    const wf = new WindowedFile({ path: resolvedPath, env, firstLine: lineNumber ? lineNumber - 1 : undefined });
    await wf._init();
    
    if (lineNumber) {
      await wf.goto(lineNumber);
    }
    
    const windowText = await wf.getWindowText({ lineNumbers: true, statusLine: true, prePostLine: true });
    console.log('[fd] open: opened 1 file(s)');
    return windowText;
  },
};

/**
 * goto tool - moves window to show specific line
 */
export const gotoTool = {
  name: 'goto',
  signature: 'goto <line_number>',
  docstring: 'Moves the window to show <line_number>',
  arguments: [
    {
      name: 'line_number',
      type: 'integer',
      description: 'The line number to move the window to',
      required: true,
    },
  ],
  async execute(env, args) {
    const lineNumber = parseInt(args.line_number);
    
    try {
      const wf = new WindowedFile({ env });
      await wf._init();
      await wf.goto(lineNumber);
      const windowText = await wf.getWindowText({ lineNumbers: true, statusLine: true, prePostLine: true });
      return windowText;
    } catch (err) {
      if (err instanceof FileNotOpened) {
        return 'No file opened. Use the open command first.';
      }
      throw err;
    }
  },
};

/**
 * scroll_up tool - moves window up
 */
export const scrollUpTool = {
  name: 'scroll_up',
  signature: 'scroll_up',
  docstring: 'Moves the window up {WINDOW} lines',
  arguments: [],
  async execute(env, args) {
    try {
      const wf = new WindowedFile({ env });
      await wf._init();
      wf.scrollUp();
      const windowText = await wf.getWindowText({ lineNumbers: true, statusLine: true, prePostLine: true });
      return windowText;
    } catch (err) {
      if (err instanceof FileNotOpened) {
        return 'No file opened. Use the open command first.';
      }
      throw err;
    }
  },
};

/**
 * scroll_down tool - moves window down
 */
export const scrollDownTool = {
  name: 'scroll_down',
  signature: 'scroll_down',
  docstring: 'Moves the window down {WINDOW} lines',
  arguments: [],
  async execute(env, args) {
    try {
      const wf = new WindowedFile({ env });
      await wf._init();
      await wf.scrollDown();
      const windowText = await wf.getWindowText({ lineNumbers: true, statusLine: true, prePostLine: true });
      return windowText;
    } catch (err) {
      if (err instanceof FileNotOpened) {
        return 'No file opened. Use the open command first.';
      }
      throw err;
    }
  },
};

/**
 * create tool - creates and opens a new file
 */
export const createTool = {
  name: 'create',
  signature: 'create <filename>',
  docstring: 'Creates and opens a new file with the given name',
  arguments: [
    {
      name: 'filename',
      type: 'string',
      description: 'The name of the file to create',
      required: true,
    },
  ],
  async execute(env, args) {
    const filename = args.filename;
    const pathResult = resolveWithinWorkspace(env, filename);
    if (pathResult.error) return pathResult.error;
    const resolvedPath = pathResult.resolved;

    try {
      // Check if file exists
      await fs.access(resolvedPath);
      return `Error: File ${resolvedPath} already exists`;
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
      // File doesn't exist, create it
    }
    
    // Create empty file
    await fs.writeFile(resolvedPath, '', 'utf-8');
    
    // Store in registry
    await writeEnv(env, 'CURRENT_FILE', resolvedPath);
    
    const wf = new WindowedFile({ path: resolvedPath, env });
    await wf._init();
    const windowText = await wf.getWindowText({ lineNumbers: true, statusLine: true, prePostLine: true });
    console.log('[fd] create: opened 1 file(s)');
    return `Created and opened file ${resolvedPath}\n\n${windowText}`;
  },
};
