/**
 * Agent exceptions. Mirrors SWE-agent's FormatError, FunctionCallingFormatError, etc.
 */

export class FormatError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FormatError';
  }
}

export class FunctionCallingFormatError extends FormatError {
  /**
   * @param {string} message
   * @param {'missing'|'multiple'|'incorrect_args'|'invalid_json'|'invalid_command'|'missing_arg'|'unexpected_arg'} errorCode
   * @param {Record<string,unknown>} [extraInfo]
   */
  constructor(message, errorCode, extraInfo = {}) {
    super(`${message} [error_code=${errorCode}]`);
    this.name = 'FunctionCallingFormatError';
    this.message = message;
    this.errorCode = errorCode;
    this.extraInfo = { errorCode, ...extraInfo };
  }
}

export class ContextWindowExceededError extends Error {
  constructor(message = 'Context window exceeded') {
    super(message);
    this.name = 'ContextWindowExceededError';
  }
}

export class CostLimitExceededError extends Error {
  constructor(message = 'Cost limit exceeded') {
    super(message);
    this.name = 'CostLimitExceededError';
  }
}

export class TotalCostLimitExceededError extends CostLimitExceededError {
  constructor(message = 'Total cost limit exceeded') {
    super(message);
    this.name = 'TotalCostLimitExceededError';
  }
}

export class ContentPolicyViolationError extends Error {
  constructor(message = 'Content policy violation') {
    super(message);
    this.name = 'ContentPolicyViolationError';
  }
}

export class ModelConfigurationError extends Error {
  constructor(message = 'Invalid model configuration') {
    super(message);
    this.name = 'ModelConfigurationError';
  }
}
