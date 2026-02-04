/**
 * Tool Registry - manages all available tools
 * Similar to SWE-agent's ToolHandler
 */

/** @typedef {Object} ToolDefinition
 * @property {string} name - Tool name (e.g., "find_file")
 * @property {string} signature - Tool signature (e.g., "find_file <file_name> [<dir>]")
 * @property {string} docstring - Tool description
 * @property {Array<{name: string, type: string, description: string, required: boolean}>} arguments
 * @property {(env: any, args: Record<string, string>) => Promise<string>} execute
 */

/** @type {Map<string, ToolDefinition>} */
const toolRegistry = new Map();

/**
 * Register a tool
 * @param {ToolDefinition} tool
 */
export function registerTool(tool) {
  if (!tool.name || !tool.signature || !tool.execute) {
    throw new Error(`Invalid tool definition: missing required fields`);
  }
  toolRegistry.set(tool.name, tool);
}

/**
 * Get a tool by name
 * @param {string} name
 * @returns {ToolDefinition | undefined}
 */
export function getTool(name) {
  return toolRegistry.get(name);
}

/**
 * Get all registered tools
 * @returns {ToolDefinition[]}
 */
export function getAllTools() {
  return Array.from(toolRegistry.values());
}

/**
 * Generate tool documentation for LLM (SWE-agent format)
 * @returns {string}
 */
export function generateToolDocs() {
  const tools = getAllTools();
  if (tools.length === 0) {
    return '';
  }
  
  return tools.map(tool => {
    let doc = `${tool.name}:\n`;
    doc += `  docstring: ${tool.docstring}\n`;
    doc += `  signature: ${tool.signature}\n`;
    
    if (tool.arguments && tool.arguments.length > 0) {
      doc += '  arguments:\n';
      for (const arg of tool.arguments) {
        const reqString = arg.required ? 'required' : 'optional';
        doc += `    - ${arg.name} (${arg.type}) [${reqString}]: ${arg.description}\n`;
      }
    } else {
      doc += '  arguments:\n';
    }
    
    return doc;
  }).join('\n');
}

/**
 * Execute a tool
 * @param {string} name - Tool name
 * @param {any} env - Environment
 * @param {Record<string, string>} args - Tool arguments
 * @returns {Promise<string>}
 */
export async function executeTool(name, env, args) {
  const tool = getTool(name);
  if (!tool) {
    throw new Error(`Tool "${name}" not found`);
  }
  return await tool.execute(env, args);
}

/**
 * Parse tool command string into tool name and arguments
 * @param {string} cmd - Command string (e.g., "find_file *.js src")
 * @returns {{name: string, args: Record<string, string>} | null}
 */
/**
 * Parse command string with proper quote handling
 * Handles: "quoted string", 'quoted string', and unquoted strings
 */
function parseCommandWithQuotes(cmd) {
  const parts = [];
  let current = '';
  let inQuotes = null;
  
  for (let i = 0; i < cmd.length; i++) {
    const char = cmd[i];
    
    if (char === '"' || char === "'") {
      if (inQuotes === null) {
        // Start of quoted string
        inQuotes = char;
      } else if (inQuotes === char) {
        // End of quoted string
        inQuotes = null;
      } else {
        // Different quote type inside string - treat as literal
        current += char;
      }
    } else if (char === ' ' && inQuotes === null) {
      // Space outside quotes - split here
      if (current.trim()) {
        parts.push(current.trim());
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  // Add remaining part
  if (current.trim()) {
    parts.push(current.trim());
  }
  
  return parts;
}

export function parseToolCommand(cmd) {
  const trimmed = cmd.trim();
  if (!trimmed) return null;

  const lines = trimmed.split('\n');
  const firstLine = lines[0].trim();
  const name = firstLine.split(/\s+/)[0];
  const tool = getTool(name);
  if (!tool) return null;

  // Multi-line format: tool has endName and cmd has end_of_edit marker (e.g. edit_range 10:15\n...\nend_of_edit)
  if (tool.endName && lines.length > 1) {
    const endMarker = String(tool.endName).trim();
    const endIdx = lines.findIndex((line, i) => i > 0 && line.trim() === endMarker);
    if (endIdx !== -1) {
      const firstParts = firstLine.split(/\s+/);
      let startLine, endLine;
      if (firstParts.length >= 2 && firstParts[1].includes(':')) {
        const [s, e] = firstParts[1].split(':').map((x) => parseInt(x, 10));
        if (!Number.isNaN(s) && !Number.isNaN(e)) {
          startLine = s;
          endLine = e;
        }
      } else if (firstParts.length >= 3) {
        const s = parseInt(firstParts[1], 10);
        const e = parseInt(firstParts[2], 10);
        if (!Number.isNaN(s) && !Number.isNaN(e)) {
          startLine = s;
          endLine = e;
        }
      }
      if (startLine != null && endLine != null) {
        const content = lines.slice(1, endIdx).join('\n');
        return { name, args: { start_line: String(startLine), end_line: String(endLine), content } };
      }
    }
  }

  // Single-line parse with quote handling
  const parts = parseCommandWithQuotes(trimmed);
  if (parts.length === 0) return null;

  // Parse arguments - first extract all --key value pairs, then positional
  const args = {};
  const positionalParts = [];
  
  // First pass: extract all --key value pairs
  let i = 1;
  while (i < parts.length) {
    const part = parts[i];
    
    if (part.startsWith('--')) {
      // Named argument: --key value or --key (boolean)
      const flagName = part.slice(2); // Remove '--'
      
      // Check if next part is a value (not another flag)
      if (i + 1 < parts.length && !parts[i + 1].startsWith('--')) {
        args[flagName] = parts[i + 1];
        i += 2;
      } else {
        // Boolean flag (no value)
        args[flagName] = 'true';
        i += 1;
      }
    } else {
      // Positional argument
      positionalParts.push(part);
      i += 1;
    }
  }
  
  // Second pass: assign positional arguments based on tool definition
  if (tool.arguments && positionalParts.length > 0) {
    let posIdx = 0;
    for (const argDef of tool.arguments) {
      // Skip arguments that were already set via --flag
      const argName = argDef.name.replace(/^--/, '');
      if (args[argName] !== undefined) continue;
      
      // Assign from positional parts
      if (posIdx < positionalParts.length) {
        args[argName] = positionalParts[posIdx++];
      } else if (argDef.required) {
        throw new Error(`Required argument "${argDef.name}" missing for tool "${name}"`);
      }
    }
    
    // If there are remaining positional parts, assign to content/query-like args
    if (posIdx < positionalParts.length) {
      const remaining = positionalParts.slice(posIdx).join(' ');
      const restArg = tool.arguments?.find(a =>
        a.name === 'query' || a.name === 'search_term' || a.name === 'content'
      );
      if (restArg && !args[restArg.name]) {
        args[restArg.name] = remaining;
      }
    }
  }
  
  return { name, args };
}

/**
 * Check if a command is a tool command
 * @param {string} cmd
 * @returns {boolean}
 */
export function isToolCommand(cmd) {
  const trimmed = cmd.trim();
  if (!trimmed) return false;
  const parts = trimmed.split(/\s+/);
  return parts.length > 0 && toolRegistry.has(parts[0]);
}
