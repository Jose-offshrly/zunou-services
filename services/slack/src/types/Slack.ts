import { Context, SlackCommandMiddlewareArgs } from '@slack/bolt'
import { WebClient } from '@slack/web-api'

export type SlackCommandWithContext = SlackCommandMiddlewareArgs & {
  client: WebClient
  context: Context
}
