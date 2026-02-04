/**
 * Simple console logger (SWE-agent style). createLogger() is used by DefaultAgent when opts.logger is not provided.
 */

/**
 * @typedef {{ info(msg: string): void, warn(msg: string): void, error(msg: string): void }} Logger
 */

/**
 * @param {{ silent?: boolean }} [opts]
 * @returns {Logger}
 */
export function createLogger(opts = {}) {
  const noop = () => {};
  const { info: i, warn: w, error: e } = opts.silent
    ? { info: noop, warn: noop, error: noop }
    : { info: (...a) => console.log(...a), warn: (...a) => console.warn(...a), error: (...a) => console.error(...a) };
  return { info: i, warn: w, error: e };
}
