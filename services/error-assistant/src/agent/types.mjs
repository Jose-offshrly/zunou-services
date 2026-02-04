/**
 * Types for the ReAct agent: step, trajectory, history, run result.
 * Mirrors SWE-agent's StepOutput, TrajectoryStep, History, AgentInfo, AgentRunResult.
 */

/**
 * @typedef {Object} StepOutput
 * @property {Array<object>} [query]
 * @property {string} [thought]
 * @property {string} [action]
 * @property {string} [output]
 * @property {string} [observation]
 * @property {number} [executionTime]
 * @property {boolean} [done]
 * @property {string|number|null} [exitStatus]
 * @property {string|null} [submission]
 * @property {Record<string,string>} [state]
 * @property {Array<object>|null} [toolCalls]
 * @property {Array<string>|null} [toolCallIds]
 * @property {Array<object>|null} [thinkingBlocks]
 * @property {Record<string,unknown>} [extraInfo]
 */

/**
 * @typedef {Object} TrajectoryStep
 * @property {string} action
 * @property {string} observation
 * @property {string} response
 * @property {Record<string,string>} state
 * @property {string} thought
 * @property {number} executionTime
 * @property {Array<object>} query
 * @property {Record<string,unknown>} extraInfo
 */

/**
 * @typedef {Object} HistoryItem
 * @property {string} role - 'system' | 'user' | 'assistant' | 'tool'
 * @property {string|Array<object>} content
 * @property {string} [messageType]
 * @property {string} [agent]
 * @property {boolean} [isDemo]
 * @property {string} [thought]
 * @property {string} [action]
 * @property {Array<object>} [toolCalls]
 * @property {Array<string>} [toolCallIds]
 * @property {Array<string>} [tags]
 */

/**
 * @typedef {HistoryItem[]} History
 */

/**
 * @typedef {TrajectoryStep[]} Trajectory
 */

/**
 * @typedef {Object} AgentInfo
 * @property {Record<string,number>} [modelStats]
 * @property {string} [exitStatus]
 * @property {string} [submission]
 * @property {Record<string,unknown>} [review]
 * @property {string} [editedFiles30]
 * @property {string} [editedFiles50]
 * @property {string} [editedFiles70]
 */

/**
 * @typedef {Object} AgentRunResult
 * @property {AgentInfo} info
 * @property {Trajectory} trajectory
 */

/**
 * @returns {StepOutput}
 */
export function createStepOutput(overrides = {}) {
  return {
    query: [],
    thought: '',
    action: '',
    output: '',
    observation: '',
    executionTime: 0,
    done: false,
    exitStatus: null,
    submission: null,
    state: {},
    toolCalls: null,
    toolCallIds: null,
    thinkingBlocks: null,
    extraInfo: {},
    ...overrides,
  };
}

/**
 * @param {StepOutput} step
 * @returns {Record<string, string|number|boolean|null>}
 */
export function stepToTemplateFormat(step) {
  const { state = {}, toolCalls, toolCallIds, ...rest } = step;
  return { ...rest, ...state };
}
