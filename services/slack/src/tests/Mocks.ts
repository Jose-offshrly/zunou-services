import {
  AllMiddlewareArgs,
  SayArguments,
  SayFn,
  SlackCommandMiddlewareArgs,
} from '@slack/bolt'

export type MiddlewareArgs = SlackCommandMiddlewareArgs & AllMiddlewareArgs

export const saySpy = jest
  .fn()
  .mockImplementation(((_message: string | SayArguments) =>
    Promise.resolve({ ok: true })) as SayFn)
