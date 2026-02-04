import { SlackCommandWithContext } from '~/types/Slack'

/**
 * @public
 *
 * Represents a sub-command available to the /sr slack command.
 */
export interface Command {
  help: () => Promise<string[]>
  run: (args: SlackCommandWithContext) => Promise<void>
  test: (command: string) => Promise<boolean>
}
