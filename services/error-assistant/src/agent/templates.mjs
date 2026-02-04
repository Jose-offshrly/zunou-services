/**
 * Template rendering for system, instance, next_step, and error messages.
 * Uses {{key}} placeholders; mirrors SWE-agent's Jinja-based TemplateConfig.
 */

/**
 * Replaces {{key}} in `template` with `data[key]`. Keys can use dots: {{a.b}} not supported here (flat only).
 * Also supports {{#if key}}...{{/if}} conditionals for optional content.
 * @param {string} template
 * @param {Record<string, string|number|boolean|undefined|null>} data
 * @returns {string}
 */
export function render(template, data = {}) {
  if (!template || typeof template !== 'string') return '';
  
  // Handle {{#if key}}...{{/if}} conditionals
  template = template.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
    const v = data[key];
    return (v !== undefined && v !== null && v !== '') ? content : '';
  });
  
  // Replace {{key}} placeholders
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = data[key];
    return v === undefined || v === null ? '' : String(v);
  });
}

/**
 * Default template names and values (SWE-agent–style). Override via config.
 */
export const DEFAULT_TEMPLATES = {
  systemTemplate: `You are an autonomous coding agent. Your task is to fix bugs: given a repo path, an error, and request logs, you identify the root cause and fix the code.

RESPONSE FORMAT:
1. First, explain your reasoning (thought/discussion).
2. Then, provide exactly ONE command in a fenced code block:

\`\`\`
<command here>
\`\`\`

The code block must contain ONLY the command to run—no comments, no command output.

EDITING BEST PRACTICES:
When editing files, follow these guidelines:

1. **Always use \`edit_range\`** when you know exact line numbers from \`open\` or \`goto\` output.

2. **CRITICAL: Multi-line format is REQUIRED.** The content must start on a NEW LINE after the line numbers:

   CORRECT FORMAT (content on new line):
   \`\`\`
   edit_range 45 50
       } catch (Exception $e) {
           Log::error('Error', ['error' => $e->getMessage()]);
           throw $e;
       }
   end_of_edit
   \`\`\`

   WRONG FORMAT (content on same line - will only capture first line!):
   \`\`\`
   edit_range 45 50 } catch (Exception $e) {
   \`\`\`

3. **For single-line edits**: Still use the multi-line format:
   \`\`\`
   edit_range 123 123
       $timezone = $user->timezone ?: 'UTC';
   end_of_edit
   \`\`\`

4. **After editing**: ALWAYS review the output to verify the edit was applied correctly. If the file looks wrong, use \`undo_edit\` immediately.

SESSION CONTROL:
- Run \`submit\` when you have fixed the issue and created a PR.
- Run \`exit\` to give up without submitting.

COMMANDS:`,
  // Error-fix use case: repo path + problem statement (error + logs). No GitHub issue/PR framing.
  instanceTemplate: `<repo>\n{{workingDir}}\n</repo>\n\nYou have access to the repository at {{workingDir}}. Fix the following bug using the error and logs below.\n\n{{problemStatement}}\n\nWhen you have fixed the code and created a PR, run \`submit\`. To stop without submitting, run \`exit\`.`,
  nextStepTemplate: 'OBSERVATION:\n{{observation}}{{#if diff}}\n\n<diff>\n{{diff}}\n</diff>{{/if}}',
  nextStepNoOutputTemplate: 'Your command ran successfully and did not produce any output. When the task is complete, run `submit`. To stop, run `exit`.',
  nextStepTruncatedTemplate: 'Observation: {{observation}}<response clipped>\n<NOTE>Observations should not exceed {{maxObservationLength}} characters. {{elidedChars}} characters were elided.</NOTE>{{#if diff}}\n\n<diff>\n{{diff}}\n</diff>{{/if}}',
  commandCancelledTimeoutTemplate: "The command '{{command}}' was cancelled (timeout {{timeout}}s). Please try a different command.",
  blocklistErrorTemplate: "Operation '{{action}}' is not supported by this environment.",
  formatErrorTemplate: 'Your output was not formatted correctly. You must always include a discussion and one command as part of your response.\n\nPlease make sure your output precisely matches this format:\nDISCUSSION\nDiscuss here what you are planning to do in this step.\n\n```\ncommand_to_run\n```',
};

/**
 * Get templates (synchronous version for constructor)
 * @param {Partial<typeof DEFAULT_TEMPLATES>} [overrides]
 * @returns {typeof DEFAULT_TEMPLATES}
 */
export function getTemplates(overrides = {}) {
  return { 
    ...DEFAULT_TEMPLATES, 
    ...overrides 
  };
}

/**
 * Get templates with tool documentation included (async version)
 * @param {Partial<typeof DEFAULT_TEMPLATES>} [overrides]
 * @returns {Promise<typeof DEFAULT_TEMPLATES>}
 */
export async function getTemplatesWithTools(overrides = {}) {
  // Load tools and generate documentation
  let toolDocs = '';
  try {
    const { loadTools } = await import('./tools/config.mjs');
    const { generateToolDocs } = await import('./tools/index.mjs');
    await loadTools();
    toolDocs = generateToolDocs();
  } catch (err) {
    console.warn('[templates] Failed to load tool docs:', err.message);
  }
  
  // Add submit and exit commands in the same format as tools (SWE-agent format)
  const sessionCommands = `submit:
  docstring: Submits the current changes and ends the session. Use this after you have successfully fixed the issue and created a PR.
  signature: submit
  arguments:

exit:
  docstring: Give up on the current challenge and terminate the session without submitting.
  signature: exit
  arguments:
`;

  // Build system template with tool docs - append after COMMANDS: header
  const systemTemplate = DEFAULT_TEMPLATES.systemTemplate + '\n' + 
    (toolDocs ? `${toolDocs}\n${sessionCommands}` : sessionCommands);
  
  return { 
    ...DEFAULT_TEMPLATES, 
    systemTemplate,
    ...overrides 
  };
}
