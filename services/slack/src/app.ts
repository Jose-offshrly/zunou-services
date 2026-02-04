import { App } from '@slack/bolt'
import type {
  BotMessageEvent,
  GenericMessageEvent,
  MessageChangedEvent,
} from '@slack/bolt/dist/types/events/message-events.d.ts'

import { askOpenAi } from '~/services/AskOpenAi'
import { getListener } from '~/services/CommandParser'
import {
  appToken,
  botToken,
  listenPort,
  signingSecret,
  slashCommand,
} from '~/services/Constants'
import { logToKestra } from '~/services/Kestra'
import { Log } from '~/services/Log'

/**
 * @private
 *
 * The Slack chat bot application instance.
 */
const app = new App({
  appToken,
  port: listenPort,
  signingSecret,
  socketMode: true,
  token: botToken,
})

// Modify your app.message event handler
app.message(async ({ message, ...rest }) => {
  try {
    if (message.type === 'message' && message.channel_type === 'im') {
      const msg = message as GenericMessageEvent

      // Don't talk to bots.
      if (
        ((msg as unknown as MessageChangedEvent).message as BotMessageEvent)
          ?.bot_id ||
        msg.bot_profile
      ) {
        return
      }

      console.log('msg', msg)
      logToKestra(msg)

      const {
        context: { teamId, userId },
        event: { channel: channelId },
      } = rest

      // In the context of a thread, we get a `thread_ts`. If the conversation has
      // just started, we don't have a thread yet, so we use `ts`.
      const event = rest.body.event as { thread_ts?: string; ts: string }
      const threadId = event.thread_ts ? event.thread_ts : event.ts

      if (!msg.text) {
        console.error('Received a message without any text', msg)
        return
      }

      // Remove the initial @mention.
      const text = msg.text.replace(/^<[^>]+>\s*/, '')

      await askOpenAi(teamId, channelId, threadId, userId, text)
    }
  } catch (err: unknown) {
    console.log('Failed to respond to im', JSON.stringify(err))
  }
})

// Pick up bot mentions in channels.
app.event('app_mention', async ({ event }) => {
  try {
    console.log('event', event)
    const {
      channel: channelId,
      team: teamId,
      ts: threadId,
      user: userId,
    } = event // as BotMessageEvent

    // Remove the initial @mention.
    const text = event.text.replace(/^<[^>]+>\s*/, '')

    await askOpenAi(teamId, channelId, threadId, userId, text)
  } catch (err: unknown) {
    console.log('Failed to respond to app mention', JSON.stringify(err))
  }
})

// Pick up slash commands.
const { client } = app
app.command(slashCommand || '', getListener(client))
;(async () => {
  await app.start()
  Log.info('⚡️ Slack app is running!')
})().catch((err) => Log.error(err))
