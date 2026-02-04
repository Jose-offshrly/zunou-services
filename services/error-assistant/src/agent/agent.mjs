/**
 * DefaultAgent: ReAct loop (Reason → Act → Observe) inspired by SWE-agent.
 * setup() → step() in a loop until done; forward() → model.query → parse → handleAction.
 */

import chalk from 'chalk';
import { createStepOutput, stepToTemplateFormat } from './types.mjs';
import { FormatError, FunctionCallingFormatError } from './exceptions.mjs';
import { render, getTemplates } from './templates.mjs';
import { parseActions } from './parser.mjs';
import { shouldBlockAction, checkSubmission, guardMultiline, isRiskyCommand } from './tools.mjs';
import { createLogger } from './logger.mjs';

/** @typedef {import('./types.mjs').StepOutput} StepOutput */
/** @typedef {import('./types.mjs').HistoryItem} HistoryItem */
/** @typedef {import('./types.mjs').TrajectoryStep} TrajectoryStep */
/** @typedef {import('./types.mjs').AgentInfo} AgentInfo */
/** @typedef {import('./types.mjs').AgentRunResult} AgentRunResult */
/** @typedef {import('./env.mjs').Env} Env */

const RETRY_WITH_OUTPUT = '###SWE-AGENT-RETRY-WITH-OUTPUT###';
const RETRY_WITHOUT_OUTPUT = '###SWE-AGENT-RETRY-WITHOUT-OUTPUT###';
const EXIT_FORFEIT = '###SWE-AGENT-EXIT-FORFEIT###';
const DEFAULT_SUBMIT_PATCH_PATH = 'model.patch';

/**
 * @param {{ message?: string, content?: string, toolCalls?: unknown[], tool_calls?: unknown[] }} out
 * @returns {{ message: string, toolCalls?: unknown[] }}
 */
function normalizeModelOutput(out) {
  const message = out?.message ?? out?.content ?? '';
  const toolCalls = out?.toolCalls ?? out?.tool_calls ?? null;
  return { message: typeof message === 'string' ? message : String(message), toolCalls };
}

export class DefaultAgent {
  /**
   * @param {Object} opts
   * @param {Env} opts.env
   * @param {{ query(messages: HistoryItem[]): Promise<{ message?: string, content?: string, toolCalls?: unknown[], tool_calls?: unknown[] }> }} opts.model
   * @param {{ getProblemStatement(): string, getId(): string } | { problemStatement: string, id: string }} opts.problemStatement
   * @param {Record<string,string>} [opts.templates]
   * @param {{ type?: 'thought_action'|'function_calling', commands?: object }} [opts.parserConfig]
   * @param {{ blocklist?: string[], blocklistStandalone?: string[] }} [opts.toolsConfig]
   * @param {number} [opts.maxRequeries]
   * @param {number} [opts.executionTimeout]
   * @param {number} [opts.maxObservationLength]
   * @param {number} [opts.maxIterations]
   * @param {string} [opts.submitPatchPath]
   * @param {string} [opts.agentName]
   * @param {{ info(msg: string): void, warn(msg: string): void }} [opts.logger] - default: createLogger()
   * @param {(cmd: string) => Promise<boolean>} [opts.confirmBeforeRun] - if set, called before non–read-only commands; return false to skip
   */
  constructor(opts) {
    this.env = opts.env;
    this.model = opts.model;
    this.problemStatement = opts.problemStatement;
    this.templates = getTemplates(opts.templates);
    this.parserConfig = opts.parserConfig ?? { type: 'thought_action', commands: {} };
    this.toolsConfig = opts.toolsConfig ?? {};
    this.confirmBeforeRun = opts.confirmBeforeRun ?? null;
    this.maxRequeries = opts.maxRequeries ?? 3;
    this.executionTimeout = opts.executionTimeout ?? 30;
    this.maxObservationLength = opts.maxObservationLength ?? 100_000;
    this.maxIterations = opts.maxIterations ?? 50;
    this.submitPatchPath = opts.submitPatchPath ?? opts.env?.submitPatchPath ?? DEFAULT_SUBMIT_PATCH_PATH;
    this.agentName = opts.agentName ?? 'main';
    this.logger = opts.logger ?? createLogger();

    /** @type {HistoryItem[]} */
    this.history = [];
    /** @type {TrajectoryStep[]} */
    this.trajectory = [];
    /** @type {AgentInfo} */
    this.info = {};
  }

  _getProblemStatement() {
    const p = this.problemStatement;
    return typeof p?.getProblemStatement === 'function' ? p.getProblemStatement() : (p?.problemStatement ?? '');
  }

  _getId() {
    const p = this.problemStatement;
    return typeof p?.getId === 'function' ? p.getId() : (p?.id ?? 'unknown');
  }

  _getFormatDict(extra = {}) {
    return {
      problemStatement: this._getProblemStatement(),
      workingDir: this.info?.workingDir ?? '/repo',
      repo: this.env?.repo?.repoName ?? '',
      ...extra,
    };
  }

  /**
   * @param {Record<string,string>} [state] - e.g. { workingDir: '/repo' }
   */
  async setup(state = {}) {
    this.history = [];
    this.trajectory = [];
    this.info = { ...state };

    const sys = render(this.templates.systemTemplate, this._getFormatDict(state));
    this.history.push({ role: 'system', content: sys, agent: this.agentName, messageType: 'system_prompt' });

    const inst = render(this.templates.instanceTemplate, this._getFormatDict(state));
    this.history.push({ role: 'user', content: inst, agent: this.agentName, messageType: 'observation' });
  }

  /**
   * @returns {HistoryItem[]}
   */
  getMessages() {
    return this.history.filter((h) => (h.agent || this.agentName) === this.agentName);
  }

  /**
   * @param {StepOutput} step
   */
  _addStepToHistory(step) {
    this.history.push({
      role: 'assistant',
      content: step.output || `${step.thought || ''}\n${step.action || ''}`.trim(),
      thought: step.thought,
      action: step.action,
      agent: this.agentName,
      messageType: 'action',
    });
    const obs = step.observation || '';
    const tpl =
      obs.length > this.maxObservationLength
        ? this.templates.nextStepTruncatedTemplate
        : !obs.trim()
          ? this.templates.nextStepNoOutputTemplate
          : this.templates.nextStepTemplate;
    const data = {
      observation: obs.slice(0, this.maxObservationLength),
      maxObservationLength: this.maxObservationLength,
      elidedChars: Math.max(0, obs.length - this.maxObservationLength),
      ...step.state,
    };
    this.history.push({
      role: 'user',
      content: render(tpl, data),
      agent: this.agentName,
      messageType: 'observation',
    });
  }

  /**
   * @param {StepOutput} step
   */
  _addStepToTrajectory(step) {
    this.trajectory.push({
      action: step.action || '',
      observation: step.observation || '',
      response: step.output || '',
      thought: step.thought || '',
      state: step.state || {},
      executionTime: step.executionTime || 0,
      query: step.query || [],
      extraInfo: step.extraInfo || {},
    });
  }

  /**
   * @param {HistoryItem[]} history
   * @returns {Promise<StepOutput>}
   */
  async forward(history) {
    const step = createStepOutput({ query: [...(history || [])] });
    const t0 = Date.now();

    this.logger.info(chalk.dim('🤔 Querying model...'));
    const raw = await this.model.query(history || []);
    const { message, toolCalls } = normalizeModelOutput(raw);
    step.output = message;

    let thought, action;
    try {
      const parsed = parseActions(
        { message, toolCalls, tool_calls: toolCalls },
        this.parserConfig
      );
      thought = parsed.thought;
      action = parsed.action;
    } catch (e) {
      step.thought = message;
      if (e && typeof (e).step === 'undefined') (e).step = step;
      throw e;
    }
    step.thought = thought;
    step.action = action;

    this.logger.info(chalk.cyan('💭 THOUGHT') + '\n' + (step.thought || '') + '\n\n' + chalk.yellow('🎬 ACTION') + '\n' + (step.action || '').trim());
    step.executionTime = (Date.now() - t0) / 1000;
    return this.handleAction(step);
  }

  /**
   * @param {StepOutput} step
   * @returns {Promise<StepOutput>}
   */
  async handleAction(step) {
    if (shouldBlockAction(step.action || '', this.toolsConfig)) {
      const e = new Error(render(this.templates.blocklistErrorTemplate, { action: step.action }));
      e.name = 'BlockedActionError';
      if (typeof (e).step === 'undefined') (e).step = step;
      throw e;
    }

    const a = (step.action || '').trim();
    if (a === 'exit') {
      step.done = true;
      step.observation = 'Exited';
      step.exitStatus = 'exit_command';
      return step;
    }
    if (a.startsWith('#')) {
      step.observation = "That is a comment, not a command. When the task is complete, run `submit`. To stop, run `exit`. Do not output comments.";
      step.executionTime = 0;
      return step;
    }

    const runAction = guardMultiline(a);

    // Only risky commands (rm, delete, chmod, dd, pipe-to-sh, etc.) trigger a prompt.
    if (a !== 'submit' && !a.startsWith('submit ') && isRiskyCommand(runAction) && this.confirmBeforeRun) {
      const ok = await this.confirmBeforeRun(runAction);
      if (!ok) {
        this.logger.info(chalk.yellow('⏭ Skipped by user: ') + runAction);
        step.observation = 'Command skipped by user.';
        step.executionTime = 0;
        return step;
      }
    }

    this.logger.info(chalk.dim('▶ Running: ') + chalk.bold(runAction));
    const t0 = Date.now();
    let observation;
    try {
      observation = await this.env.communicate(runAction, {
        timeout: this.executionTimeout,
        check: 'ignore',
      });
    } catch (err) {
      observation = render(this.templates.commandCancelledTimeoutTemplate, {
        command: runAction,
        timeout: this.executionTimeout,
      });
    }
    step.executionTime = (Date.now() - t0) / 1000;
    step.observation = observation;

    // Get state after action (runs state commands and reads state.json)
    step.state = await this.getState();

    if (observation.includes(RETRY_WITH_OUTPUT)) {
      step.observation = observation.replace(RETRY_WITH_OUTPUT, '');
      const e = new Error('RetryWithOutput');
      if (typeof (e).step === 'undefined') (e).step = step;
      throw e;
    }
    if (observation.includes(RETRY_WITHOUT_OUTPUT)) {
      step.observation = observation.replace(RETRY_WITHOUT_OUTPUT, '');
      const e = new Error('RetryWithoutOutput');
      if (typeof (e).step === 'undefined') (e).step = step;
      throw e;
    }
    if (observation.includes(EXIT_FORFEIT)) {
      const e = new Error('ExitForfeit');
      if (typeof (e).step === 'undefined') (e).step = step;
      throw e;
    }

    return this.handleSubmission(step);
  }

  /**
   * @param {StepOutput} step
   * @param {boolean} [force]
   * @returns {Promise<StepOutput>}
   */
  async handleSubmission(step, force = false) {
    const obs = step.observation || '';
    if (!force && !checkSubmission(obs)) return step;
    // Submission marker detected - set done=true first to ensure termination
    step.done = true;
    step.exitStatus = step.exitStatus ? `submitted (${step.exitStatus})` : 'submitted';
    // Try to read submission content, but don't fail if file doesn't exist
    try {
      const content = await this.env.readFile(this.submitPatchPath, { encoding: 'utf-8' });
      step.submission = (content || '').trim() || null;
      step.observation = step.submission ?? step.observation;
      this.logger.info(chalk.green(`Found submission (${step.submission?.length ?? 0} chars)`));
    } catch {
      // File read failed, but submission marker was detected, so we still terminate
      step.observation = 'Submitted';
      this.logger.info(chalk.green('Found submission marker (file read failed)'));
    }
    return step;
  }

  /**
   * @param {StepOutput} [step]
   * @returns {Promise<StepOutput>}
   */
  async attemptAutosubmit(step = createStepOutput()) {
    step = { ...createStepOutput(), ...step, done: true };
    try {
      const content = await this.env.readFile(this.submitPatchPath, { encoding: 'utf-8' });
      if ((content || '').trim()) {
        step.submission = content.trim();
        step.observation = 'Exited (autosubmitted)';
      }
    } catch (_) {}
    return step;
  }

  /**
   * @param {HistoryItem[]} history
   * @returns {Promise<StepOutput>}
   */
  async forwardWithHandling(history) {
    let n = 0;
    while (n < this.maxRequeries) {
      try {
        return await this.forward(history);
      } catch (e) {
        const step = (e && (e).step) || createStepOutput({ output: (e && (e).message) || String(e) });
        const isFormat = e instanceof FormatError || e instanceof FunctionCallingFormatError;
        const isBlocked = e?.name === 'BlockedActionError';
        const isRetryOut = e?.message === 'RetryWithOutput';
        const isRetryNo = e?.message === 'RetryWithoutOutput';
        const isForfeit = e?.message === 'ExitForfeit';

        if (isForfeit) {
          return this.attemptAutosubmit(step);
        }
        if (isFormat || isBlocked) {
          n += 1;
          this.logger.warn(chalk.yellow(`Requerying model after ${e?.name || e?.constructor?.name || 'Error'} (${n}th requery)`));
          const tpl = isBlocked
            ? this.templates.blocklistErrorTemplate
            : this.templates.formatErrorTemplate;
          const data = { ...stepToTemplateFormat(step), exceptionMessage: (e && (e).message) || '' };
          history = [
            ...history,
            { role: 'assistant', content: step.output || '', agent: this.agentName },
            { role: 'user', content: render(tpl, data), agent: this.agentName },
          ];
          continue;
        }
        if (isRetryOut) {
          const tpl = this.templates.nextStepTemplate;
          history = [
            ...history,
            { role: 'assistant', content: step.output || '', agent: this.agentName },
            { role: 'user', content: render(tpl, { observation: step.observation || '' }), agent: this.agentName },
          ];
          continue;
        }
        if (isRetryNo) {
          continue;
        }
        return this.attemptAutosubmit(step);
      }
    }
    return this.attemptAutosubmit(createStepOutput({ exitStatus: 'exit_format' }));
  }

  /**
   * @returns {Promise<StepOutput>}
   */
  async step() {
    const nStep = this.trajectory.length + 1;
    this.logger.info(chalk.bold.magenta(`======== STEP ${nStep} ========`));
    const messages = this.getMessages();
    const step = await this.forwardWithHandling(messages);
    const obs = (step.observation || '').trim();
    if (obs) {
      const max = 600;
      this.logger.info(chalk.gray('📋 OBSERVATION') + '\n' + (obs.length <= max ? obs : obs.slice(0, max) + '\n...'));
    }
    this._addStepToHistory(step);
    this.info.exitStatus = step.exitStatus ?? this.info.exitStatus;
    this.info.submission = step.submission ?? this.info.submission;
    this._addStepToTrajectory(step);
    return step;
  }

  /**
   * Run the ReAct loop until done (submit, exit, or error). setup() and the step loop run here.
   * @param {Record<string, unknown>} [state] - passed to setup(), e.g. { workingDir }
   * @returns {Promise<AgentRunResult>}
   */
  async run(state = {}) {
    await this.setup(state);
    this.logger.info(chalk.green('Running agent'));
    let step = createStepOutput();
    let iterationCount = 0;
    while (!step.done) {
      iterationCount++;
      if (iterationCount > this.maxIterations) {
        this.logger.warn(chalk.yellow(`Max iterations (${this.maxIterations}) reached. Stopping agent.`));
        step.done = true;
        step.exitStatus = `max_iterations_reached (${this.maxIterations})`;
        step.observation = `Agent stopped after reaching maximum iterations (${this.maxIterations}).`;
        break;
      }
      step = await this.step();
    }
    this.logger.info(chalk.green('Done'));
    return {
      info: this.info,
      trajectory: this.trajectory,
    };
  }

  /**
   * Get state from environment (runs state commands and reads state.json)
   * @returns {Promise<Record<string, any>>}
   */
  async getState() {
    try {
      // Import state commands from config
      const { TOOL_CONFIG } = await import('./tools/config.mjs');
      const { executeTool } = await import('./tools/index.mjs');
      
      // Run all state commands
      const stateCommands = TOOL_CONFIG.state_commands || [];
      for (const stateCmd of stateCommands) {
        try {
          const envForTools = { ...this.env, cwd: this.env.cwd || process.cwd() };
          await executeTool(stateCmd, envForTools, {});
        } catch (err) {
          // Warn but don't fail on state command errors
          this.logger.warn(`[agent] State command ${stateCmd} failed: ${err.message}`);
        }
      }
      
      // Read state from state.json
      const { getState } = await import('./tools/diff_state/index.mjs');
      const state = await getState(this.env);
      
      return state;
    } catch (err) {
      this.logger.warn(`[agent] Failed to get state: ${err.message}`);
      return {};
    }
  }

  /**
   * @returns {{ trajectory: TrajectoryStep[], history: HistoryItem[], info: AgentInfo }}
   */
  getTrajectoryData() {
    return {
      trajectory: [...this.trajectory],
      history: [...this.history],
      info: { ...this.info },
    };
  }
}
