import { WebClient } from '@slack/web-api'

import { displayHelp, getListener } from '~/services/CommandParser'
import { MiddlewareArgs, saySpy } from '~/tests/Mocks'

describe('CommandParser', () => {
  describe('displayHelp', () => {
    it('displays help information', async () => {
      await displayHelp(saySpy)
      const expected = expect.stringMatching(/^Available commands:/)
      expect(saySpy).toHaveBeenCalledWith(expected)
    })
  })

  describe('getListener', () => {
    const listener = getListener(null as unknown as WebClient)
    const middlewareArgs = {
      ack: () => undefined,
      command: { text: 'help' },
      say: saySpy,
    } as unknown as MiddlewareArgs

    it('executes valid commands', async () => {
      await listener(middlewareArgs)
      const expected = expect.stringMatching(/^Available commands:/)
      expect(saySpy).toHaveBeenCalledWith(expected)
    })

    it('handles invalid commands', async () => {
      const invalid = {
        ...middlewareArgs,
        command: { text: 'shimmy' },
      } as unknown as MiddlewareArgs
      await listener(invalid)
      expect(saySpy).toHaveBeenCalledWith("Sorry, I don't know how to *shimmy*")
    })
  })
})
