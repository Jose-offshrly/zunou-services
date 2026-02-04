/**
 * OpenAI model adapter. Implements the agent model interface (SWE-agent AbstractModel.query).
 */

import OpenAI from 'openai';

/**
 * Agent model interface: any implementation (OpenAI, Anthropic, etc.) must provide query(messages).
 * Matches SWE-agent: query(history) -> dict with message, optional tool_calls.
 * @typedef {Object} AgentModel
 * @property {(messages: Array<{ role: string, content: string }>) => Promise<{ message: string, toolCalls?: unknown[] }>} query
 */

/**
 * Creates an OpenAI-backed model that implements the agent model interface.
 * @param {object} env - Loaded env (OPENAI_API_KEY, OPENAI_MODEL)
 * @returns {AgentModel}
 */
export function createOpenAIModel(env) {
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const modelName = env.OPENAI_MODEL;

  return {
    async query(messages) {
      const msgs = messages
        .filter((m) => ['system', 'user', 'assistant'].includes(m.role))
        .map((m) => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : (Array.isArray(m.content) ? m.content : String(m.content)),
        }));
      const r = await client.chat.completions.create({
        model: modelName,
        messages: msgs,
        temperature: 0,
      });
      const msg = r.choices[0]?.message;
      return {
        message: msg?.content ?? '',
        toolCalls: msg?.tool_calls?.length ? msg.tool_calls : undefined,
      };
    },
  };
}
