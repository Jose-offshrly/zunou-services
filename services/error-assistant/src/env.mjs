/**
 * Load and validate process.env; required keys enforced, optional have defaults.
 */

import { EnvError } from './errors.mjs';

const DEFAULTS = {
  OPENAI_MODEL: 'gpt-4o-mini',
  GITHUB_APP_PRIVATE_KEY: '',
  GITHUB_APP_PRIVATE_KEY_PATH: '',
  GITHUB_APP_EMAIL: '',
  LOCAL_TEST: 'false',
  FROM_EMAIL: '',
  DEFAULT_NOTIFICATION_EMAIL: '',
};

const REQUIRED_KEYS = [
  'REPO_URL',
  'GITHUB_APP_ID',
  'GITHUB_INSTALLATION_ID',
  'OPENAI_API_KEY',
];

/**
 * Loads and validates env; throws EnvError on failure.
 * @returns {object} env
 * @throws {EnvError}
 */
export function loadEnv() {
  console.log('[loadEnv] Loading env...');
  const raw = { ...process.env };

  const env = {
    REPO_URL: raw.REPO_URL ?? '',
    GITHUB_APP_ID: raw.GITHUB_APP_ID ?? '',
    GITHUB_INSTALLATION_ID: raw.GITHUB_INSTALLATION_ID ?? '',
    GITHUB_APP_PRIVATE_KEY: raw.GITHUB_APP_PRIVATE_KEY ?? DEFAULTS.GITHUB_APP_PRIVATE_KEY,
    GITHUB_APP_PRIVATE_KEY_PATH: raw.GITHUB_APP_PRIVATE_KEY_PATH ?? DEFAULTS.GITHUB_APP_PRIVATE_KEY_PATH,
    OPENAI_API_KEY: raw.OPENAI_API_KEY ?? '',
    OPENAI_MODEL: raw.OPENAI_MODEL ?? DEFAULTS.OPENAI_MODEL,
    AWS_REGION: raw.AWS_REGION ?? '',
    GITHUB_APP_EMAIL: raw.GITHUB_APP_EMAIL ?? DEFAULTS.GITHUB_APP_EMAIL,
    LOCAL_TEST: raw.LOCAL_TEST ?? DEFAULTS.LOCAL_TEST,
    FROM_EMAIL: raw.FROM_EMAIL ?? DEFAULTS.FROM_EMAIL,
    DEFAULT_NOTIFICATION_EMAIL: raw.DEFAULT_NOTIFICATION_EMAIL ?? DEFAULTS.DEFAULT_NOTIFICATION_EMAIL,
  };

  for (const key of REQUIRED_KEYS) {
    if (!env[key] || String(env[key]).trim() === '') {
      throw new EnvError(`Missing required env: ${key}`);
    }
  }

  const hasPrivateKey =
    (env.GITHUB_APP_PRIVATE_KEY && env.GITHUB_APP_PRIVATE_KEY.trim() !== '') ||
    (env.GITHUB_APP_PRIVATE_KEY_PATH && env.GITHUB_APP_PRIVATE_KEY_PATH.trim() !== '');
  if (!hasPrivateKey) {
    throw new EnvError('Missing required env: set GITHUB_APP_PRIVATE_KEY or GITHUB_APP_PRIVATE_KEY_PATH');
  }

  console.log('[loadEnv] Env loaded');
  return env;
}
