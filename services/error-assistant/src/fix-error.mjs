/**
 * Fix error: parse event, fetch logs, run agent, return result.
 */

import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import fs from 'fs/promises';
import path from 'path';
import { LogContextError } from './errors.mjs';
import { decodeLogsData, buildErrorEventsFromLogEvents, fetchRequestLogsUpToError } from './logs.mjs';
import { getGitUser } from './git.mjs';
import { createModel } from './model/index.mjs';
import { getAgentDir, getServicePath } from './config.mjs';
import { DefaultAgent } from './agent/agent.mjs';
import { createEnv } from './agent/env/index.mjs';
import { getTemplatesWithTools } from './agent/templates.mjs';

/**
 * Parses event and fetches log context. Throws LogContextError when event has no payload.
 * @param {object} event - Lambda event (awslogs.data)
 * @param {object} env - Loaded env
 * @returns {Promise<{ logGroup: string, errorEvents: object[], firstRequestId: string|null, firstTs: number|null, requestLogsUpToError: Array<{ ts: number, message: string }> }>}
 * @throws {LogContextError}
 */
export async function getLogContext(event, env) {
  console.log('[getLogContext] Getting log context...');
  const payload = event?.awslogs?.data;
  if (!payload) {
    throw new LogContextError('no awslogs.data in event');
  }
  const decoded = decodeLogsData(payload);
  const { logGroup, logEvents } = decoded;
  const { errorEvents, firstRequestId, firstTs } = buildErrorEventsFromLogEvents(logEvents);
  const cw = new CloudWatchLogsClient({ region: env.AWS_REGION });
  const requestLogsUpToError = await fetchRequestLogsUpToError(
    cw,
    logGroup,
    firstRequestId,
    firstTs,
    errorEvents
  );
  console.log('[getLogContext] Log context ready');
  return { logGroup, errorEvents, firstRequestId, firstTs, requestLogsUpToError };
}

/**
 * Strip workspace prefix from paths in error/stack text so agent sees workspace-relative paths only.
 * @param {string} text - Error summary or stack trace text
 * @param {string} servicePath - Non-empty service path (e.g. services/api)
 * @returns {string}
 */
function normalizePathsToWorkspace(text, servicePath) {
  if (!servicePath || typeof text !== 'string') return text;
  const segment = servicePath.replace(/\/+$/, '');
  const pathSegment = segment.split('/').map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[/\\\\]') + '[/\\\\]';
  const re = new RegExp(`(?:^|.*?[/\\\\])${pathSegment}`, 'g');
  return text.replace(re, '');
}

/**
 * Builds the problem statement for the agent from error events and request logs.
 * @param {object} params
 * @param {object[]} params.errorEvents - Parsed error events
 * @param {Array<{ ts: number, message: string }>} params.requestLogsUpToError - Request logs up to error
 * @param {string} params.requestId - Request ID (caller should normalize null to 'unknown')
 * @param {string} params.logGroup - Log group name
 * @param {string} params.servicePath - Service path (e.g. services/api); empty means repo root
 * @returns {string}
 */
function buildProblemStatement({ errorEvents, requestLogsUpToError, requestId, logGroup, servicePath }) {
  let errorSummary = errorEvents
    .map((e) => {
      const parts = [];
      if (e.errorType) parts.push(`Type: ${e.errorType}`);
      if (e.errorMessage) parts.push(`Message: ${e.errorMessage}`);
      if (e.stackTrace) parts.push(`Stack: ${Array.isArray(e.stackTrace) ? e.stackTrace.join('\n') : e.stackTrace}`);
      return parts.length ? parts.join('\n') : (e.message || 'Unknown error');
    })
    .join('\n\n---\n\n');

  if (servicePath) {
    errorSummary = normalizePathsToWorkspace(errorSummary, servicePath);
  }

  const requestLogsText = requestLogsUpToError
    .map((log) => {
      const ts = new Date(log.ts).toISOString();
      return `[${ts}] ${log.message}`;
    })
    .join('\n');

  const scopeBlock = servicePath
    ? `
<scope>
Your workspace is the service directory only: **${servicePath}**.
All file paths (open, find_file, search_file, search_dir, create, edit) are relative to this directory.
Do not search or modify files outside ${servicePath} (e.g. other services like ai-proxy, dashboard).
</scope>
`
    : '';

  const scopeSuffix = servicePath ? ` within ${servicePath}` : '';

  return `Fix the following error that occurred in the application:

<error>
${errorSummary}
</error>

<context>
Request ID: ${requestId}
Log Group: ${logGroup}
Total log lines: ${requestLogsUpToError.length}
</context>
${scopeBlock}
<request_logs>
${requestLogsText}
</request_logs>

Analyze the error, identify the root cause, and fix the code${scopeSuffix}.

Only create a PR when you are sure your change fixes the error. Do not create a PR if your only change is adding logs (e.g. console.log, logging)—that is not a real fix; only create a PR when you have made a real code change that addresses the root cause.
Attempt to identify and fix the error; only if you conclude it cannot be fixed by code (e.g. external, root cause not findable), explain why and provide suggestions, then stop—do not create a PR.

Finally, create a PR with the changes to complete the task. Skip running tests suite for now, it not setup yet.`;
}

/**
 * Runs agent to fix the error using pre-fetched log context.
 * @param {object} params
 * @param {object} params.env - Loaded env
 * @param {string} params.repoPath - Workspace path to the repository
 * @param {object} params.logContext - From getLogContext(event, env)
 * @returns {Promise<{ success: boolean, message: string, gitUser?: object, changes?: object[], trajectory?: number, errorEvents: object[] }>}
 */
export async function fixError({ env, repoPath, logContext }) {
  console.log('[fixError] Running agent...');
  const { logGroup, errorEvents, firstRequestId, requestLogsUpToError } = logContext;
  const model = createModel(env);
  const gitUser = await getGitUser(repoPath);

  const requestId = firstRequestId ?? 'unknown';
  const servicePath = getServicePath();
  const agentWorkspace = servicePath === '' ? repoPath : path.join(repoPath, servicePath);
  const problemStatement = buildProblemStatement({
    errorEvents,
    requestLogsUpToError,
    requestId,
    logGroup,
    servicePath,
  });

  const agentEnv = createEnv({ cwd: agentWorkspace, repoRoot: repoPath });
  await agentEnv.start?.();

  try {
    const agent = new DefaultAgent({
      env: agentEnv,
      model,
      problemStatement: {
        getProblemStatement: () => problemStatement,
        getId: () => `error-fix-${requestId}`,
      },
      templates: await getTemplatesWithTools(),
      parserConfig: { type: 'thought_action' },
      executionTimeout: 60,
      logger: {
        info: (msg) => console.log(`[Agent] ${msg}`),
        warn: (msg) => console.warn(`[Agent] ${msg}`),
      },
    });

    agent.submitPatchPath = agentEnv.submitPatchPath;

    const { info, trajectory } = await agent.run({ workingDir: agentWorkspace });

    await agentEnv.close?.();

    const trajectoryAgentDir = getAgentDir(repoPath);
    await fs.mkdir(trajectoryAgentDir, { recursive: true }).catch(() => {});
    const trajectoryPath = path.join(trajectoryAgentDir, `error-fix-${requestId}.json`);
    await fs.writeFile(
      trajectoryPath,
      JSON.stringify(
        {
          info,
          trajectory,
          history: agent.getTrajectoryData().history,
        },
        null,
        2
      ),
      'utf-8'
    ).catch(() => {});

    console.log('[fixError] Agent completed');
    return {
      success: info.exitStatus === 'submitted' || info.exitStatus?.includes('submitted'),
      message: `Agent completed with status: ${info.exitStatus}`,
      gitUser,
      changes: info.submission ? [{ file: 'model.patch', action: 'modify', description: info.submission }] : undefined,
      trajectory: trajectory.length,
      errorEvents,
    };
  } catch (err) {
    await agentEnv.close?.();
    console.error('Agent execution failed:', err);
    return {
      success: false,
      message: `Agent failed: ${err.message}`,
      gitUser,
      errorEvents,
    };
  }
}
