import { slashCommand, version } from '~/services/Constants'
import { Log } from '~/services/Log'
import { SlackCommandWithContext } from '~/types/Slack'

const commandRegex = new RegExp('^\\s*version\\s*$', 'i')

/**
 * @public
 *
 * Returns help messages explaining what commands are available.
 * @returns an array of help messages explaining the available commands.
 */
export const help = async (): Promise<string[]> => {
  return Promise.resolve([
    `*${slashCommand} version*: Replies with the current bot version`,
  ])
}

/**
 * @public
 *
 * Decides whether this command should be run or not.
 * @param commandText The command text typed in by the user.
 * @returns true if we should execute this command, false otherwise.
 */
export const test = async (commandText: string): Promise<boolean> => {
  return Promise.resolve(commandRegex.test(commandText.trim().toLowerCase()))
}

/**
 * @public
 *
 * Triggers a Github action to create the release.
 * @param _client         The Slack web client instance.
 * @param middlewareArgs  The arguments associated with the invoked /command.
 * @returns void
 */
export const run = async (
  middlewareArgs: SlackCommandWithContext,
): Promise<void> => {
  const {
    body: { user_name: userName },
    say,
  } = middlewareArgs

  Log.info('Replying to version request', { userName })
  await say(`The current version is ${version} :point_up:`)

  return Promise.resolve()
}

export default {
  help,
  run,
  test,
}
