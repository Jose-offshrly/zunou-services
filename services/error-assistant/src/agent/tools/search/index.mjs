/**
 * Search tools - find_file, search_dir, search_file
 * Similar to SWE-agent's search bundle
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { glob } from 'glob';
import { resolveWithinWorkspace } from '../resolve-within-workspace.mjs';

const execAsync = promisify(exec);

/**
 * find_file tool - finds files by name/pattern
 */
export const findFileTool = {
  name: 'find_file',
  signature: 'find_file <file_name> [<dir>]',
  docstring: 'finds all files with the given name or pattern in dir. If dir is not provided, searches in the current directory',
  arguments: [
    {
      name: 'file_name',
      type: 'string',
      description: 'the name of the file or pattern to search for. supports shell-style wildcards (e.g. *.py)',
      required: true,
    },
    {
      name: 'dir',
      type: 'string',
      description: 'the directory to search in (if not provided, searches in the current directory)',
      required: false,
    },
  ],
  async execute(env, args) {
    let fileName = args.file_name;
    const rawDir = args.dir || env.cwd || process.cwd();
    const dirResult = resolveWithinWorkspace(env, rawDir);
    if (dirResult.error) return dirResult.error;
    const searchDir = dirResult.resolved;

    try {
      // Check if directory exists
      try {
        await fs.access(searchDir);
      } catch {
        console.log('[fd] find_file: opened 0 file(s)');
        return `Directory ${searchDir} not found`;
      }
      
      // Handle special case: "*" means list all files
      if (fileName === '*' || fileName === '"*"' || fileName === "'*'") {
        // List all files recursively
        const pattern = path.join(searchDir, '**', '*');
        const matches = await glob(pattern, {
          ignore: ['**/node_modules/**', '**/.git/**', '**/.*'],
          absolute: true,
          onlyFiles: true,
        });
        
        if (matches.length === 0) {
          console.log('[fd] find_file: opened 0 file(s)');
          return `No files found in ${searchDir}`;
        }
        
        const relativeMatches = matches.map(m => path.relative(searchDir, m));
        const result = [
          `Found ${matches.length} files in ${searchDir}:`,
          ...relativeMatches,
        ].join('\n');
        console.log(`[fd] find_file: opened ${matches.length} file(s)`);
        return result;
      }
      
      // Use glob to find files (supports wildcards)
      // If fileName contains a path separator or wildcard, use it directly
      // Otherwise, search recursively
      let pattern;
      if (fileName.includes('/') || fileName.includes('\\') || fileName.includes('**')) {
        // Pattern already includes path
        pattern = path.isAbsolute(fileName) ? fileName : path.join(searchDir, fileName);
      } else {
        // Simple filename/pattern - search recursively
        pattern = path.join(searchDir, '**', fileName);
      }
      
      const matches = await glob(pattern, {
        ignore: ['**/node_modules/**', '**/.git/**', '**/.*'],
        absolute: true,
        onlyFiles: true, // Only return files, not directories
      });
      
      if (matches.length === 0) {
        console.log('[fd] find_file: opened 0 file(s)');
        return `No matches found for "${args.file_name}" in ${searchDir}`;
      }
      
      const numMatches = matches.length;
      const relativeMatches = matches.map(m => path.relative(searchDir, m));
      const result = [
        `Found ${numMatches} matches for "${args.file_name}" in ${searchDir}:`,
        ...relativeMatches,
      ].join('\n');
      console.log(`[fd] find_file: opened ${numMatches} file(s)`);
      return result;
    } catch (err) {
      console.log('[fd] find_file: opened 0 file(s)');
      return `Error searching for files: ${err.message}`;
    }
  },
};

/**
 * search_dir tool - searches for text in all files in a directory
 */
export const searchDirTool = {
  name: 'search_dir',
  signature: 'search_dir <search_term> [<dir>]',
  docstring: 'searches for search_term in all files in dir. If dir is not provided, searches in the current directory',
  arguments: [
    {
      name: 'search_term',
      type: 'string',
      description: 'the term to search for',
      required: true,
    },
    {
      name: 'dir',
      type: 'string',
      description: 'the directory to search in (if not provided, searches in the current directory)',
      required: false,
    },
  ],
  async execute(env, args) {
    const searchTerm = args.search_term;
    const rawDir = args.dir || env.cwd || process.cwd();
    const dirResult = resolveWithinWorkspace(env, rawDir);
    if (dirResult.error) return dirResult.error;
    const searchDir = dirResult.resolved;

    try {
      // Check if directory exists
      try {
        await fs.access(searchDir);
      } catch {
        return `Directory ${searchDir} not found`;
      }
      
      // Use grep to search (cross-platform)
      // Escape special characters in search term
      const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      const { stdout, stderr } = await execAsync(
        `grep -rnIH -- "${escapedTerm}" "${searchDir}"`,
        {
          cwd: searchDir,
          maxBuffer: 10 * 1024 * 1024,
        }
      );
      
      if (stderr && !stdout) {
        console.log('[fd] search_dir: opened 0 file(s)');
        return `No matches found for "${searchTerm}" in ${searchDir}`;
      }
      
      // Parse grep output: file:line:content
      const lines = stdout.split('\n').filter(Boolean);
      const fileMatches = new Map();
      
      for (const line of lines) {
        const match = line.match(/^([^:]+):(\d+):(.+)$/);
        if (match) {
          const [, file, lineNum] = match;
          if (!fileMatches.has(file)) {
            fileMatches.set(file, 0);
          }
          fileMatches.set(file, fileMatches.get(file) + 1);
        }
      }
      
      if (fileMatches.size === 0) {
        console.log('[fd] search_dir: opened 0 file(s)');
        return `No matches found for "${searchTerm}" in ${searchDir}`;
      }
      
      // Format output
      const totalMatches = lines.length;
      const numFiles = fileMatches.size;
      
      if (numFiles > 100) {
        console.log(`[fd] search_dir: opened ${numFiles} file(s)`);
        return `More than ${numFiles} files matched for "${searchTerm}" in ${searchDir}. Please narrow your search.`;
      }
      
      const result = [
        `Found ${totalMatches} matches for "${searchTerm}" in ${searchDir}:`,
        ...Array.from(fileMatches.entries()).map(([file, count]) => {
          const relPath = path.relative(searchDir, file);
          return `${relPath} (${count} matches)`;
        }),
        `End of matches for "${searchTerm}" in ${searchDir}`,
      ].join('\n');
      console.log(`[fd] search_dir: opened ${numFiles} file(s)`);
      return result;
    } catch (err) {
      if (err.code === 1) {
        // grep returns 1 when no matches found
        console.log('[fd] search_dir: opened 0 file(s)');
        return `No matches found for "${searchTerm}" in ${searchDir}`;
      }
      return `Error searching directory: ${err.message}`;
    }
  },
};

/**
 * search_file tool - searches for text in a specific file
 */
export const searchFileTool = {
  name: 'search_file',
  signature: 'search_file <search_term> [<file>]',
  docstring: 'searches for search_term in file. If file is not provided, searches in the current open file',
  arguments: [
    {
      name: 'search_term',
      type: 'string',
      description: 'the term to search for',
      required: true,
    },
    {
      name: 'file',
      type: 'string',
      description: 'the file to search in (if not provided, searches in the current open file)',
      required: false,
    },
  ],
  async execute(env, args) {
    const searchTerm = args.search_term;
    let file = args.file;
    
    // If no file provided, use current open file from registry
    if (!file) {
      const { readEnv } = await import('../registry.mjs');
      file = await readEnv(env, 'CURRENT_FILE');
      if (!file) {
        return 'No file open. Use the open command first.';
      }
    }
    
    if (file) {
      const fileResult = resolveWithinWorkspace(env, file);
      if (fileResult.error) return fileResult.error;
      file = fileResult.resolved;
    }
    const cwd = env.cwd || process.cwd();
    const filePath = path.isAbsolute(file) ? file : path.resolve(cwd, file);
    
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Escape special characters in search term
      const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Use grep to search in file
      const { stdout, stderr } = await execAsync(
        `grep -nH -- "${escapedTerm}" "${filePath}"`,
        {
          maxBuffer: 10 * 1024 * 1024,
        }
      );
      
      if (stderr && !stdout) {
        return `No matches found for "${searchTerm}" in ${filePath}`;
      }
      
      const lines = stdout.split('\n').filter(Boolean);
      
      if (lines.length === 0) {
        return `No matches found for "${searchTerm}" in ${filePath}`;
      }
      
      if (lines.length > 100) {
        return `More than 100 lines matched for "${searchTerm}" in ${filePath}. Please narrow your search.`;
      }
      
      // Format output with line numbers and content
      const result = [
        `Found ${lines.length} matches for "${searchTerm}" in ${filePath}:`,
        ...lines.map(line => {
          const match = line.match(/^([^:]+):(\d+):(.+)$/);
          if (match) {
            const [, , lineNum, content] = match;
            return `Line ${lineNum}:${content}`;
          }
          return line;
        }),
        `End of matches for "${searchTerm}" in ${filePath}`,
      ].join('\n');
      console.log('[fd] search_file: opened 1 file(s)');
      return result;
    } catch (err) {
      if (err.code === 'ENOENT') {
        return `File "${filePath}" not found.`;
      }
      if (err.code === 1) {
        // grep returns 1 when no matches found
        return `No matches found for "${searchTerm}" in ${filePath}`;
      }
      return `Error searching file: ${err.message}`;
    }
  },
};
