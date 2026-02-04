/**
 * Parse model output into (thought, action). Supports:
 * - thought_action: text + last ```...``` block
 * - function_calling: message + single tool_calls[0]
 */

import { FormatError, FunctionCallingFormatError } from './exceptions.mjs';

/**
 * Thought-action: thought is everything before the last ``` block; action is the last block's content.
 * @param {string} message
 * @returns {{ thought: string, action: string }}
 * @throws {FormatError}
 */
export function parseThoughtAction(message) {
  if (!message || typeof message !== 'string') throw new FormatError('Empty or invalid message');
  const re = /^```(?:\S*)?\s*\n([\s\S]*?)^```\s*$/gm;
  let last;
  for (let m; (m = re.exec(message)) !== null;) last = m;
  if (!last) throw new FormatError('No action found in model response (expected a ```...``` block).');
  const action = last[1].trim();
  const before = message.slice(0, last.index);
  const after = message.slice(last.index + last[0].length);
  const thought = (before + after).trim();
  return { thought, action };
}

/**
 * Function-calling: requires exactly one tool call. thought = message; action = built from tool call.
 * @param {{ message?: string, toolCalls?: Array<{ function: { name: string, arguments?: string|object } }> }} modelOutput
 * @param {Record<string, { name: string, arguments: Array<{ name: string, required?: boolean }> }>} commands - name -> spec
 * @returns {{ thought: string, action: string }}
 * @throws {FunctionCallingFormatError|FormatError}
 */
export function parseFunctionCall(modelOutput, commands = {}) {
  const msg = modelOutput?.message ?? '';
  const calls = modelOutput?.toolCalls ?? (modelOutput?.tool_calls ?? []);
  if (!Array.isArray(calls) || calls.length !== 1) {
    const code = !calls?.length ? 'missing' : 'multiple';
    throw new FunctionCallingFormatError(
      `Expected exactly one tool call, got ${calls?.length ?? 0}.`,
      code,
      { numTools: calls?.length ?? 0 }
    );
  }
  const call = calls[0];
  const fn = call?.function ?? call;
  const name = fn?.name;
  if (!name) throw new FormatError('Tool call has no function name.');
  const spec = commands[name];
  let args = fn?.arguments;
  if (typeof args === 'string') {
    try {
      args = JSON.parse(args);
    } catch {
      throw new FunctionCallingFormatError('Tool call arguments are not valid JSON.', 'invalid_json');
    }
  }
  args = args && typeof args === 'object' ? args : {};
  if (spec?.arguments) {
    const required = spec.arguments.filter((a) => a.required).map((a) => a.name);
    const missing = required.filter((k) => args[k] == null || args[k] === '');
    if (missing.length) {
      throw new FunctionCallingFormatError(`Required argument(s) missing: ${missing.join(', ')}`, 'missing_arg');
    }
  }
  // Build action string: "name arg1_value arg2_value" or "name" for submit
  const parts = [name];
  if (Object.keys(args).length) {
    for (const v of Object.values(args)) {
      if (v != null && v !== '') parts.push(String(v).includes(' ') ? `"${String(v).replace(/"/g, '\\"')}"` : String(v));
    }
  }
  const action = parts.join(' ');
  return { thought: msg, action };
}

/**
 * @param {{ message?: string, toolCalls?: unknown[], tool_calls?: unknown[] }} modelOutput
 * @param {{ type: 'thought_action'|'function_calling', commands?: object }} [config]
 * @returns {{ thought: string, action: string }}
 */
export function parseActions(modelOutput, config = {}) {
  const { type = 'thought_action', commands = {} } = config;
  if (type === 'function_calling') {
    return parseFunctionCall(modelOutput, commands);
  }
  return parseThoughtAction(modelOutput?.message ?? modelOutput?.content ?? '');
}
