/**
 * Model factory and interface. Use createModel(env) to get an implementation (OpenAI today; Anthropic etc. later).
 * Interface aligned with SWE-agent's AbstractModel.query (sweagent/agent/models.py).
 *
 * Agent model interface:
 * - query(messages): Promise<{ message: string, toolCalls?: unknown[] }>
 *   messages: Array<{ role: string, content: string }>
 */

import { createOpenAIModel } from './openai.mjs';

/**
 * Creates a model from env. Today returns OpenAI; can switch on env for Anthropic later.
 * @param {object} env - Loaded env
 * @returns {{ query(messages: object[]): Promise<{ message: string, toolCalls?: unknown[] }> }}
 */
export function createModel(env) {
  return createOpenAIModel(env);
}

export { createOpenAIModel } from './openai.mjs';
