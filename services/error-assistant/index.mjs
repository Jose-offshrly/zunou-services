import { loadEnv } from './src/env.mjs';
import { prepareWorkspace } from './src/git.mjs';
import { getLogContext, fixError } from './src/fix-error.mjs';
import { checkDuplicate, markProcessed } from './src/deduplication.mjs';

/**
 * @param {object} event - { awslogs: { data: string } }
 * @param {object} context - Lambda context
 */
export async function handler(event, context) {
  const env = loadEnv();
  const repoPath = await prepareWorkspace(env);

  const logContext = await getLogContext(event, env);

  const { isDuplicate, hash } = await checkDuplicate(logContext.errorEvents);
  if (isDuplicate) {
    return { skipped: true, reason: 'duplicate', hash };
  }

  const result = await fixError({ env, repoPath, logContext });

  await markProcessed(result.errorEvents);
  return result;
}
