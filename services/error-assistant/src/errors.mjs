/** Error classes for env, workspace, and log-context failures. */

export class EnvError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EnvError';
  }
}

export class WorkspaceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WorkspaceError';
  }
}

export class LogContextError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LogContextError';
  }
}
