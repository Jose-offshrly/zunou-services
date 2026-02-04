/**
 * Jest tests for windowed edit tools: edit_range, replace_window, edit (search/replace), insert.
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { editRangeTool, replaceWindowTool, editTool, insertTool } from './index.mjs';
import { writeEnv } from '../registry.mjs';
import { loadTools } from '../config.mjs';
import { parseToolCommand, executeTool } from '../index.mjs';

describe('edit_range', () => {
  test('replaces lines 1-2 with new content in opened file', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-range-'));
    const filePath = path.join(tmpDir, 'test.txt');
    await fs.writeFile(filePath, 'line1\nline2\nline3\n', 'utf8');

    const env = { cwd: tmpDir };
    await writeEnv(env, 'CURRENT_FILE', 'test.txt');

    const result = await editRangeTool.execute(env, {
      start_line: 1,
      end_line: 2,
      content: 'new1\nnew2',
    });

    const content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe('new1\nnew2\nline3\n');
    expect(result).toContain('Lines replaced');
    expect(result).toContain('new1');
    expect(result).toContain('new2');
    expect(result).toContain('line3');

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('single line replacement', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-range-'));
    const filePath = path.join(tmpDir, 'f.txt');
    await fs.writeFile(filePath, 'a\nb\nc\n', 'utf8');

    const env = { cwd: tmpDir };
    await writeEnv(env, 'CURRENT_FILE', 'f.txt');

    await editRangeTool.execute(env, {
      start_line: 2,
      end_line: 2,
      content: 'B',
    });

    const content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe('a\nB\nc\n');

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('when no file is open, returns error message', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-range-'));
    const env = { cwd: tmpDir };

    const result = await editRangeTool.execute(env, {
      start_line: 1,
      end_line: 1,
      content: 'x',
    });

    expect(result).toContain('No file opened');
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('invalid range (start_line > end_line) returns error', async () => {
    const result = await editRangeTool.execute(
      { cwd: process.cwd() },
      { start_line: 3, end_line: 1, content: 'x' }
    );
    expect(result).toContain('start_line (3) must be <= end_line (1)');
  });

  test('invalid start_line or end_line (non-positive) returns error', async () => {
    const result = await editRangeTool.execute(
      { cwd: process.cwd() },
      { start_line: 0, end_line: 1, content: 'x' }
    );
    expect(result).toContain('Invalid start_line or end_line');
  });

  test('clamps range to file bounds', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-range-'));
    const filePath = path.join(tmpDir, 'short.txt');
    await fs.writeFile(filePath, 'a\nb\nc', 'utf8');

    const env = { cwd: tmpDir };
    await writeEnv(env, 'CURRENT_FILE', 'short.txt');

    await editRangeTool.execute(env, {
      start_line: 1,
      end_line: 999,
      content: 'one',
    });

    const content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe('one');

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('empty content replaces range with one empty line', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-range-'));
    const filePath = path.join(tmpDir, 'del.txt');
    await fs.writeFile(filePath, 'keep1\nremove1\nremove2\nkeep2', 'utf8');

    const env = { cwd: tmpDir };
    await writeEnv(env, 'CURRENT_FILE', 'del.txt');

    await editRangeTool.execute(env, {
      start_line: 2,
      end_line: 3,
      content: '',
    });

    const content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe('keep1\n\nkeep2');

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('tool metadata: name and signature', () => {
    expect(editRangeTool.name).toBe('edit_range');
    expect(editRangeTool.signature).toContain('start_line');
    expect(editRangeTool.signature).toContain('end_line');
    expect(editRangeTool.signature).toContain('content');
  });

  test('unescapes PHP dollar signs when LLM incorrectly escapes them', async () => {
    // This tests the fix for: LLMs often escape $ as \$ thinking they need to prevent interpolation
    // The tool should automatically unescape \$ to $
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-range-'));
    const filePath = path.join(tmpDir, 'test.php');
    await fs.writeFile(filePath, '<?php\n$old = "value";\n?>', 'utf8');

    const env = { cwd: tmpDir };
    await writeEnv(env, 'CURRENT_FILE', 'test.php');

    // Simulate LLM sending escaped dollar signs (common mistake)
    await editRangeTool.execute(env, {
      start_line: 2,
      end_line: 2,
      content: '\\$new = \\$old ?? "default";',  // LLM escaped the $ signs
    });

    const content = await fs.readFile(filePath, 'utf8');
    // Should be properly unescaped PHP code
    expect(content).toBe('<?php\n$new = $old ?? "default";\n?>');

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('edit_range with end_of_edit multi-line format parses and executes', async () => {
    await loadTools();
    const parsed = parseToolCommand('edit_range 2:3\nREPLACED_LINE\nend_of_edit');
    expect(parsed).not.toBeNull();
    expect(parsed.name).toBe('edit_range');
    expect(parsed.args.start_line).toBe('2');
    expect(parsed.args.end_line).toBe('3');
    expect(parsed.args.content).toBe('REPLACED_LINE');

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-range-'));
    const filePath = path.join(tmpDir, 'f.txt');
    await fs.writeFile(filePath, 'a\nb\nc\nd\n', 'utf8');
    const env = { cwd: tmpDir };
    await writeEnv(env, 'CURRENT_FILE', 'f.txt');

    await executeTool(parsed.name, env, parsed.args);
    const content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe('a\nREPLACED_LINE\nd\n');

    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});

describe('replace_window', () => {
  test('replaces currently displayed window with new content', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'replace-window-'));
    const filePath = path.join(tmpDir, 'f.txt');
    await fs.writeFile(filePath, 'one\ntwo\nthree\nfour\nfive\n', 'utf8');

    const env = { cwd: tmpDir };
    await writeEnv(env, 'CURRENT_FILE', 'f.txt');
    await writeEnv(env, 'FIRST_LINE', '1');
    await writeEnv(env, 'WINDOW', '3');

    const result = await replaceWindowTool.execute(env, {
      content: 'NEW1\nNEW2\nNEW3',
    });

    const content = await fs.readFile(filePath, 'utf8');
    // Window is lines 2–4 (FIRST_LINE=1, WINDOW=3), so "two","three","four" → NEW1,NEW2,NEW3
    expect(content).toBe('one\nNEW1\nNEW2\nNEW3\nfive\n');
    expect(result).toContain('Current window replaced');

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('when no file is open, returns error', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'replace-window-'));
    const result = await replaceWindowTool.execute({ cwd: tmpDir }, { content: 'x' });
    expect(result).toContain('No file opened');
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('tool metadata: name and signature', () => {
    expect(replaceWindowTool.name).toBe('replace_window');
    expect(replaceWindowTool.signature).toContain('content');
  });
});

describe('edit (search/replace)', () => {
  test('replaces first occurrence in window', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-sr-'));
    const filePath = path.join(tmpDir, 'f.txt');
    // Single occurrence in window so replace proceeds (multiple would trigger "make search more specific")
    await fs.writeFile(filePath, 'hello\nworld\nfoo\n', 'utf8');

    const env = { cwd: tmpDir };
    await writeEnv(env, 'CURRENT_FILE', 'f.txt');

    const result = await editTool.execute(env, {
      search: 'hello',
      replace: 'hi',
    });

    const content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe('hi\nworld\nfoo\n');
    expect(result).toContain('Text replaced');

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('replace-all replaces all occurrences in file', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-sr-'));
    const filePath = path.join(tmpDir, 'f.txt');
    await fs.writeFile(filePath, 'x\nx\nx\n', 'utf8');

    const env = { cwd: tmpDir };
    await writeEnv(env, 'CURRENT_FILE', 'f.txt');

    await editTool.execute(env, {
      search: 'x',
      replace: 'y',
      'replace-all': true,
    });

    const content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe('y\ny\ny\n');

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('unescapes PHP dollar signs in search and replace strings', async () => {
    // Test that the edit tool correctly unescapes \$ to $ in both search and replace
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-sr-'));
    const filePath = path.join(tmpDir, 'test.php');
    await fs.writeFile(filePath, '<?php\n$timezone = $user->timezone;\n?>', 'utf8');

    const env = { cwd: tmpDir };
    await writeEnv(env, 'CURRENT_FILE', 'test.php');

    // Simulate the exact scenario from the agent log where LLM escaped $ as \$
    await editTool.execute(env, {
      search: '\\$timezone = \\$user->timezone;',    // LLM escaped the search
      replace: '\\$timezone = \\$user->timezone ?: "UTC";',  // LLM escaped the replace
    });

    const content = await fs.readFile(filePath, 'utf8');
    // Should have proper PHP syntax with unescaped $ signs
    expect(content).toBe('<?php\n$timezone = $user->timezone ?: "UTC";\n?>');

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('when search equals replace, returns no-changes message', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-sr-'));
    await fs.writeFile(path.join(tmpDir, 'f.txt'), 'a\n', 'utf8');
    const env = { cwd: tmpDir };
    await writeEnv(env, 'CURRENT_FILE', 'f.txt');

    const result = await editTool.execute(env, { search: 'a', replace: 'a' });
    expect(result).toContain('same');
    expect(result).toContain('No changes');

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('when no file is open, returns error', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-sr-'));
    const env = { cwd: tmpDir };
    const result = await editTool.execute(env, { search: 'a', replace: 'b' });
    expect(result).toContain('No file opened');
    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});

describe('insert', () => {
  test('inserts at end when line not specified', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'insert-'));
    const filePath = path.join(tmpDir, 'f.txt');
    await fs.writeFile(filePath, 'line1', 'utf8');

    const env = { cwd: tmpDir };
    await writeEnv(env, 'CURRENT_FILE', 'f.txt');

    const result = await insertTool.execute(env, { text: 'line2\nline3' });

    const content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe('line1\nline2\nline3');
    expect(result).toContain('Text inserted');

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('inserts after specific line when line specified', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'insert-'));
    const filePath = path.join(tmpDir, 'f.txt');
    await fs.writeFile(filePath, 'a\nb\nc', 'utf8');

    const env = { cwd: tmpDir };
    await writeEnv(env, 'CURRENT_FILE', 'f.txt');

    // line: 1 = insert after first line (1-based)
    await insertTool.execute(env, { text: 'INSERTED', line: 1 });

    const content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe('a\nINSERTED\nb\nc');

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('when no file is open, returns error', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'insert-'));
    const result = await insertTool.execute({ cwd: tmpDir }, { text: 'x' });
    expect(result).toContain('No file opened');
    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});

describe('undo_edit', () => {
  test('undoes the last edit_range edit', async () => {
    const { undoEditTool } = await import('./index.mjs');
    const { clearHistory } = await import('../windowed/lib.mjs');
    
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'undo-'));
    const filePath = path.join(tmpDir, 'test.txt');
    const originalContent = 'line1\nline2\nline3\n';
    await fs.writeFile(filePath, originalContent, 'utf8');

    const env = { cwd: tmpDir };
    await writeEnv(env, 'CURRENT_FILE', 'test.txt');
    
    // Clear any existing history
    clearHistory(filePath);

    // Make an edit
    await editRangeTool.execute(env, {
      start_line: 2,
      end_line: 2,
      content: 'MODIFIED',
    });

    // Verify the edit was applied
    let content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe('line1\nMODIFIED\nline3\n');

    // Undo the edit
    const result = await undoEditTool.execute(env, {});
    expect(result).toContain('undone successfully');

    // Verify the file is restored
    content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe(originalContent);

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('supports multiple undos', async () => {
    const { undoEditTool } = await import('./index.mjs');
    const { clearHistory } = await import('../windowed/lib.mjs');
    
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'undo-'));
    const filePath = path.join(tmpDir, 'test.txt');
    await fs.writeFile(filePath, 'original', 'utf8');

    const env = { cwd: tmpDir };
    await writeEnv(env, 'CURRENT_FILE', 'test.txt');
    
    // Clear any existing history
    clearHistory(filePath);

    // Make multiple edits
    await editRangeTool.execute(env, { start_line: 1, end_line: 1, content: 'edit1' });
    await editRangeTool.execute(env, { start_line: 1, end_line: 1, content: 'edit2' });
    await editRangeTool.execute(env, { start_line: 1, end_line: 1, content: 'edit3' });

    let content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe('edit3');

    // Undo to edit2
    await undoEditTool.execute(env, {});
    content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe('edit2');

    // Undo to edit1
    await undoEditTool.execute(env, {});
    content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe('edit1');

    // Undo to original
    await undoEditTool.execute(env, {});
    content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe('original');

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('returns error when no edit history exists', async () => {
    const { undoEditTool } = await import('./index.mjs');
    const { clearHistory } = await import('../windowed/lib.mjs');
    
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'undo-'));
    const filePath = path.join(tmpDir, 'test.txt');
    await fs.writeFile(filePath, 'content', 'utf8');

    const env = { cwd: tmpDir };
    await writeEnv(env, 'CURRENT_FILE', 'test.txt');
    
    // Clear any existing history
    clearHistory(filePath);

    const result = await undoEditTool.execute(env, {});
    expect(result).toContain('No edit history');

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('when no file is open, returns error', async () => {
    const { undoEditTool } = await import('./index.mjs');
    
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'undo-'));
    const result = await undoEditTool.execute({ cwd: tmpDir }, {});
    expect(result).toContain('No file opened');
    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
