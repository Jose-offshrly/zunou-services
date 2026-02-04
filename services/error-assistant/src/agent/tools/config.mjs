/**
 * Tool configuration - defines which tools are enabled and environment variables
 * Similar to SWE-agent's ToolConfig
 */

export const TOOL_CONFIG = {
  bundles: [
    'search',         // Search tools (find_file, search_dir, search_file)
    'web',            // Web search tool
    'registry',       // Registry tool (for state management)
    'windowed',       // Windowed file navigation (open, goto, scroll, create)
    'windowed_edit',  // Windowed editing (edit, insert)
    'diff_state',     // Diff state tracking
    'pr',             // PR creation tool (create_pr)
  ],
  state_commands: [
    '_state_diff_state',  // Update state with git diff
  ],
  env_variables: {
    PAGER: 'cat',
    MANPAGER: 'cat',
    LESS: '-R',
    PIP_PROGRESS_BAR: 'off',
    TQDM_DISABLE: '1',
    GIT_PAGER: 'cat',
    // Node.js specific
    npm_config_progress: 'false',
  },
};

/**
 * Load tools based on configuration
 */
export async function loadTools() {
  const { registerTool } = await import('./index.mjs');
  
  // Load search tools
  if (TOOL_CONFIG.bundles.includes('search')) {
    const { findFileTool, searchDirTool, searchFileTool } = await import('./search/index.mjs');
    registerTool(findFileTool);
    registerTool(searchDirTool);
    registerTool(searchFileTool);
  }
  
  // Load web search tool
  if (TOOL_CONFIG.bundles.includes('web')) {
    const { webSearchTool } = await import('./web/index.mjs');
    registerTool(webSearchTool);
  }
  
  // Load registry tools
  if (TOOL_CONFIG.bundles.includes('registry')) {
    const { registryTool, writeEnvTool } = await import('./registry.mjs');
    registerTool(registryTool);
    registerTool(writeEnvTool);
  }
  
  // Load windowed tools
  if (TOOL_CONFIG.bundles.includes('windowed')) {
    const { openTool, gotoTool, scrollUpTool, scrollDownTool, createTool } = await import('./windowed/index.mjs');
    registerTool(openTool);
    registerTool(gotoTool);
    registerTool(scrollUpTool);
    registerTool(scrollDownTool);
    registerTool(createTool);
  }
  
  // Load windowed edit tools (edit_range, replace_window, edit, insert, undo_edit)
  if (TOOL_CONFIG.bundles.includes('windowed_edit')) {
    const { editRangeTool, replaceWindowTool, editTool, insertTool, undoEditTool } = await import('./windowed_edit/index.mjs');
    registerTool(editRangeTool);
    registerTool(replaceWindowTool);
    registerTool(editTool);
    registerTool(insertTool);
    registerTool(undoEditTool);
  }
  
  // Load diff state tool (internal, but register it so it can be called)
  if (TOOL_CONFIG.bundles.includes('diff_state')) {
    const { diffStateTool } = await import('./diff_state/index.mjs');
    registerTool(diffStateTool);
  }

  // Load PR tools
  if (TOOL_CONFIG.bundles.includes('pr')) {
    const { createPrTool } = await import('./pr/index.mjs');
    registerTool(createPrTool);
  }
}
