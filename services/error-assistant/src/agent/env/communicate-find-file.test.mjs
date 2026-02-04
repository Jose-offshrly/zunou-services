/**
 * Jest test: communicate + find_file (one test, one find).
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';
import { createEnv } from './create-env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVICE_ROOT = path.resolve(__dirname, '..', '..', '..');

describe('communicate find_file', () => {
  let env;

  beforeAll(async () => {
    env = createEnv({ cwd: SERVICE_ROOT, repoName: 'error-assistant' });
    await env.start();
  });

  test('communicate("find_file package.json") returns found result', async () => {
    const result = await env.communicate('find_file package.json');
    expect(result).toMatch(/Found \d+ (matches?|files?) for "package\.json"/);
    expect(result).toContain('package.json');
  });
});
