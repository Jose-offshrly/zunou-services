import { Middleware, SayFn, SlackCommandMiddlewareArgs } from '@slack/bolt'
import { WebClient } from '@slack/web-api'

import Ping from '~/commands/Ping'
import Version from '~/commands/Version'
import { Log } from '~/services/Log'
import { SlackCommandWithContext } from '~/types/Slack'
import { Command } from '~/types/Zunou'

const commands: Command[] = [Ping, Version]

/**
 * @private
 *
 * Sends a usage message to the user explaining what commands are available.
 * @param say Slack method to send a message to the user.
 */
export const displayHelp = async (say: SayFn): Promise<void> => {
  const message = (await Promise.all(commands.map((cmd) => cmd.help())))
    .flat()
    .sort()
    .map((msg: string) => `- ${msg}`)
    .join('\n')
  await say(`Available commands:\n\n${message}`)
}

/**
 * @public
 *
 * Returns a Slack command listener that can route command events to the appropriate services.
 * @param client The Slack web client instance.
 * @returns Slack middleware.
 */
export const getListener = (
  _client: WebClient,
): Middleware<SlackCommandMiddlewareArgs> => {
  return async (middlewareArgs: SlackCommandWithContext) => {
    const { ack, command, say } = middlewareArgs
    await ack()

    const commandText = command.text.trim()
    Log.info('Received command', { text: commandText })

    try {
      for (const cmd of commands) {
        if (await cmd.test(commandText)) {
          await cmd.run(middlewareArgs)
          return
        }
      }

      if (commandText === 'help') {
        await displayHelp(middlewareArgs.say)
        return
      }

      await say(`Sorry, I don't know how to *${commandText}*`)
    } catch (err) {
      await say(`Sorry, something went wrong (*${(err as Error).message}*)`)
    }
  }
}
