/**
 * Windowed Edit Replace tools - advanced editing with windowed view
 * Similar to SWE-agent's windowed_edit_replace bundle
 */

import { WindowedFile, FileNotOpened, TextNotFound, getFileHistory, saveToHistory } from '../windowed/lib.mjs';

const RETRY_WITH_OUTPUT = '###SWE-AGENT-RETRY-WITH-OUTPUT###';

const UNDO_SUCCESS_MSG = `Last edit undone successfully. Here's the restored file content:`;

const NO_EDIT_HISTORY_MSG = `No edit history found for this file. Cannot undo.`;

/**
 * Unescape common patterns that LLMs incorrectly escape.
 * Models often escape $ characters thinking they need to prevent shell/string interpolation,
 * but our tools take strings literally.
 * 
 * Examples:
 *   \$variable -> $variable
 *   \\n (literal backslash-n, not meant as newline) -> left as is
 * 
 * @param {string} str - The input string
 * @returns {string} - The unescaped string
 */
function unescapeLLMString(str) {
  if (!str) return str;
  
  // Unescape \$ to $ (common LLM mistake for PHP, shell, etc.)
  // But preserve actual escaped backslashes (\\$)
  return str
    .replace(/(?<!\\)\\(?=\$)/g, '') // Remove single backslash before $
    .replace(/\\\\/g, '\\');          // Normalize double backslash to single
}

const NOT_FOUND = `Your edit was not applied (file not modified): Text {search} not found in displayed lines (or anywhere in the file).
Please modify your search string. Did you forget to properly handle whitespace/indentation?
You can also call \`open\` again to re-display the file with the correct context.`;

const NOT_FOUND_IN_WINDOW_MSG = `Your edit was not applied (file not modified): Text {search} not found in displayed lines.

However, we found the following occurrences of your search string in the file:

{occurrences}

You can use the \`goto\` command to navigate to these locations before running the edit command again.`;

const MULTIPLE_OCCURRENCES_MSG = `Your edit was not applied (file not modified): Found more than one occurrence of {search} in the currently displayed lines.
Please make your search string more specific (for example, by including more lines of context).`;

const NO_CHANGES_MADE_MSG = `Your search and replace strings are the same. No changes were made. Please modify your search or replace strings.`;

const SINGLE_EDIT_SUCCESS_MSG = `Text replaced. Please review the changes and make sure they are correct:

1. The edited file is correctly indented
2. The edited file does not contain duplicate lines
3. The edit does not break existing functionality

Edit the file again if necessary.`;

const MULTIPLE_EDITS_SUCCESS_MSG = `Replaced {n_replacements} occurrences. Please review the changes and make sure they are correct:

1. The edited file is correctly indented
2. The edited file does not contain duplicate lines
3. The edit does not break existing functionality

Edit the file again if necessary.`;

const EDIT_RANGE_SUCCESS_MSG = `Lines replaced. One contiguous range per edit—use line numbers from the last \`open\` output. Review the changes and edit again if necessary.`;

const REPLACE_WINDOW_SUCCESS_MSG = `Current window replaced. Review the changes and edit again if necessary.`;

/**
 * edit_range tool - replace lines by range (position-based, single replacement per edit).
 * Robust: no search string; specify start_line, end_line (1-based inclusive) and new content.
 * Supports end_of_edit multi-line format: edit_range <start>:<end> then lines then end_of_edit.
 */
export const editRangeTool = {
  name: 'edit_range',
  endName: 'end_of_edit',
  signature: 'edit_range <start_line> <end_line>\\n<content>\\nend_of_edit',
  docstring: `Replace lines <start_line> through <end_line> (inclusive) with <content> in the currently opened file.
Line numbers are 1-based; use the line numbers from the last \`open\` or \`goto\` output.

IMPORTANT: Use multi-line format. Content must start on a NEW LINE after the line numbers:

edit_range <start_line> <end_line>
<your new content here - can be multiple lines>
<include proper indentation>
end_of_edit

Rules:
1. One contiguous range per edit—only lines start_line..end_line are replaced.
2. Include proper indentation in <content>; newlines are preserved.
3. Open the file first with \`open\` to see line numbers, then call edit_range.

Example - replace lines 45-47:
edit_range 45 47
    } catch (Exception $e) {
        throw $e;
    }
end_of_edit`,
  arguments: [
    {
      name: 'start_line',
      type: 'integer',
      description: 'first line to replace (1-based, inclusive)',
      required: true,
    },
    {
      name: 'end_line',
      type: 'integer',
      description: 'last line to replace (1-based, inclusive)',
      required: true,
    },
    {
      name: 'content',
      type: 'string',
      description: 'new content for that line range (include indentation and newlines)',
      required: true,
    },
  ],
  async execute(env, args) {
    const startLine1 = parseInt(args.start_line, 10);
    const endLine1 = parseInt(args.end_line, 10);
    const content = unescapeLLMString(args.content ?? '');

    if (!Number.isInteger(startLine1) || startLine1 < 1 || !Number.isInteger(endLine1) || endLine1 < 1) {
      return 'Invalid start_line or end_line: must be positive integers (1-based).';
    }
    if (startLine1 > endLine1) {
      return `Invalid range: start_line (${startLine1}) must be <= end_line (${endLine1}).`;
    }

    try {
      const wf = new WindowedFile({ env, exitOnException: false });
      await wf._init();

      // Save to history before editing (for undo support)
      const currentContent = await wf.getText();
      saveToHistory(wf.path, currentContent);

      const nLines = await wf.getLineCount();
      // Convert 1-based inclusive to 0-based inclusive; clamp to file bounds
      const start = Math.max(0, Math.min(startLine1 - 1, nLines - 1));
      const end = Math.max(start, Math.min(endLine1 - 1, nLines - 1));

      await wf.setWindowText(content, [start, end]);
      await wf.goto(start + 1);

      const windowText = await wf.getWindowText({ lineNumbers: true, statusLine: true, prePostLine: true });
      return `${EDIT_RANGE_SUCCESS_MSG}\n\n${windowText}`;
    } catch (err) {
      if (err instanceof FileNotOpened) {
        return `No file opened. Use \`open\` or \`create\` a file first.`;
      }
      throw err;
    }
  },
};

/**
 * replace_window tool - replace the currently displayed window with new content.
 * No line numbers needed; replaces whatever lines are currently visible (SWE-agent windowed_edit_rewrite).
 */
export const replaceWindowTool = {
  name: 'replace_window',
  signature: 'replace_window <content>',
  docstring: `Replace the currently displayed window (visible lines) with <content> in the opened file.
Use \`open\` or \`goto\` first to show the lines you want to replace. No line numbers needed—the entire visible window is replaced.
Include proper indentation and newlines in <content>.`,
  arguments: [
    {
      name: 'content',
      type: 'string',
      description: 'new content for the current window (include indentation and newlines)',
      required: true,
    },
  ],
  async execute(env, args) {
    const content = unescapeLLMString(args.content ?? '');

    try {
      const wf = new WindowedFile({ env, exitOnException: false });
      await wf._init();

      // Save to history before editing (for undo support)
      const currentContent = await wf.getText();
      saveToHistory(wf.path, currentContent);

      const [start, end] = await wf.getLineRange();
      await wf.setWindowText(content, [start, end]);
      await wf.goto(start + 1);

      const windowText = await wf.getWindowText({ lineNumbers: true, statusLine: true, prePostLine: true });
      return `${REPLACE_WINDOW_SUCCESS_MSG}\n\n${windowText}`;
    } catch (err) {
      if (err instanceof FileNotOpened) {
        return `No file opened. Use \`open\` or \`create\` a file first.`;
      }
      throw err;
    }
  },
};

/**
 * edit tool - replace text in currently displayed lines (search-based)
 */
export const editTool = {
  name: 'edit',
  signature: 'edit <search> <replace> [<replace-all>]',
  docstring: `Replace first occurrence of <search> with <replace> in the currently displayed lines.
If replace-all is True, replace all occurrences of <search> with <replace>.

For example, if you are looking at this file:

def fct():
    print("Hello world")

and you want to edit the file to read:

def fct():
    print("Hello")
    print("world")

you can search for \`Hello world\` and replace with \`"Hello"\\n    print("world")\`
(note the extra spaces before the print statement!).

Tips:

1. Always include proper whitespace/indentation
2. When you are adding an if/with/try statement, you need to INDENT the block that follows, so make sure to include it in both your search and replace strings!
3. If you are wrapping code in a try statement, make sure to also add an 'except' or 'finally' block.

Before every edit, please

1. Explain the code you want to edit and why it is causing the problem
2. Explain the edit you want to make and how it fixes the problem
3. Explain how the edit does not break existing functionality`,
  arguments: [
    {
      name: 'search',
      type: 'string',
      description: 'the text to search for (make sure to include proper whitespace if needed)',
      required: true,
    },
    {
      name: 'replace',
      type: 'string',
      description: 'the text to replace the search with (make sure to include proper whitespace if needed)',
      required: true,
    },
    {
      name: 'replace-all',
      type: 'boolean',
      description: 'replace all occurrences rather than the first occurrence within the displayed lines',
      required: false,
    },
  ],
  async execute(env, args) {
    const search = unescapeLLMString(args.search);
    const replace = unescapeLLMString(args.replace);
    const replaceAll = args['replace-all'] === 'true' || args['replace-all'] === true;
    
    try {
      const wf = new WindowedFile({ env, exitOnException: false });
      await wf._init();
      
      if (search === replace) {
        return `${NO_CHANGES_MADE_MSG}\n${RETRY_WITH_OUTPUT}`;
      }
      
      try {
        // Save to history before editing (for undo support)
        const currentContent = await wf.getText();
        saveToHistory(wf.path, currentContent);

        if (!replaceAll) {
          const windowText = await wf.getWindowText();
          const occurrences = (windowText.match(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
          
          if (occurrences > 1) {
            return `${MULTIPLE_OCCURRENCES_MSG.replace('{search}', search)}\n${RETRY_WITH_OUTPUT}`;
          }
          
          const replacementInfo = await wf.replaceInWindow(search, replace);
          
          const windowTextAfter = await wf.getWindowText({ lineNumbers: true, statusLine: true, prePostLine: true });
          return `${SINGLE_EDIT_SUCCESS_MSG}\n\n${windowTextAfter}`;
        } else {
          const replacementInfo = await wf.replace(search, replace);
          const windowTextAfter = await wf.getWindowText({ lineNumbers: true, statusLine: true, prePostLine: true });
          return `${MULTIPLE_EDITS_SUCCESS_MSG.replace('{n_replacements}', replacementInfo.nReplacements.toString())}\n\n${windowTextAfter}`;
        }
      } catch (err) {
        if (err instanceof TextNotFound) {
          const lineNumbers = await wf.findAllOccurrences(search, false);
          if (lineNumbers.length > 0) {
            const occurrences = lineNumbers.map(ln => `- line ${ln}`).join('\n');
            return `${NOT_FOUND_IN_WINDOW_MSG.replace('{search}', search).replace('{occurrences}', occurrences)}\n${RETRY_WITH_OUTPUT}`;
          } else {
            return `${NOT_FOUND.replace('{search}', search)}\n${RETRY_WITH_OUTPUT}`;
          }
        }
        throw err;
      }
    } catch (err) {
      if (err instanceof FileNotOpened) {
        return `No file opened. Either \`open\` or \`create\` a file first.\n${RETRY_WITH_OUTPUT}`;
      }
      throw err;
    }
  },
};

/**
 * insert tool - insert text at end or after specific line
 */
export const insertTool = {
  name: 'insert',
  signature: 'insert <text> [<line>]',
  docstring: 'Insert <text> at the end of the currently opened file or after <line> if specified.',
  arguments: [
    {
      name: 'text',
      type: 'string',
      description: 'the text to insert',
      required: true,
    },
    {
      name: 'line',
      type: 'integer',
      description: 'the line number to insert the text as new lines after',
      required: false,
    },
  ],
  async execute(env, args) {
    const text = unescapeLLMString(args.text);
    const line = args.line ? parseInt(args.line) : null;
    
    try {
      const wf = new WindowedFile({ env, exitOnException: false });
      await wf._init();
      const fileText = await wf.getText();

      // Save to history before editing (for undo support)
      saveToHistory(wf.path, fileText);

      const lines = fileText.split('\n');
      
      if (line !== null) {
        // Insert after specific line (1-based)
        const insertIndex = Math.min(line, lines.length);
        lines.splice(insertIndex, 0, ...text.split('\n'));
      } else {
        // Insert at end
        lines.push(...text.split('\n'));
      }
      
      await wf.setText(lines.join('\n'));
      
      // Move window to show inserted text
      if (line !== null) {
        await wf.goto(line + 1);
      } else {
        await wf.goto(lines.length);
      }
      
      const windowText = await wf.getWindowText({ lineNumbers: true, statusLine: true, prePostLine: true });
      return `Text inserted.\n\n${windowText}`;
    } catch (err) {
      if (err instanceof FileNotOpened) {
        return `No file opened. Either \`open\` or \`create\` a file first.\n${RETRY_WITH_OUTPUT}`;
      }
      throw err;
    }
  },
};

/**
 * undo_edit tool - undo the last edit to the currently opened file
 * Similar to SWE-agent's str_replace_editor undo_edit command
 */
export const undoEditTool = {
  name: 'undo_edit',
  signature: 'undo_edit',
  docstring: `Undo the last edit made to the currently opened file.
Multiple undos are supported (up to 10 edits back). Each call to undo_edit reverts one edit.`,
  arguments: [],
  async execute(env, args) {
    const { popFromHistory } = await import('../windowed/lib.mjs');
    
    try {
      const wf = new WindowedFile({ env, exitOnException: false });
      await wf._init();
      
      const previousContent = popFromHistory(wf.path);
      if (!previousContent) {
        return NO_EDIT_HISTORY_MSG;
      }
      
      await wf.setText(previousContent);
      
      const windowText = await wf.getWindowText({ lineNumbers: true, statusLine: true, prePostLine: true });
      return `${UNDO_SUCCESS_MSG}\n\n${windowText}`;
    } catch (err) {
      if (err instanceof FileNotOpened) {
        return `No file opened. Use \`open\` a file first.`;
      }
      throw err;
    }
  },
};
