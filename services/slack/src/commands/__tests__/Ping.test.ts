import { help, run, test } from '~/commands/Ping'
import { MiddlewareArgs, saySpy } from '~/tests/Mocks'

describe('Ping', () => {
  describe('help', () => {
    it('returns a help message', async () => {
      const expected = [
        expect.stringMatching(/Checks that the slack bot is running/),
      ]
      expect(await help()).toEqual(expect.arrayContaining(expected))
    })
  })

  describe('run', () => {
    const middlewareArgs = {
      body: {
        user_id: '12345',
      },
      command: {
        text: 'ping',
      },
      say: saySpy,
    } as unknown as MiddlewareArgs

    it('acknowledges the ping', async () => {
      await run(middlewareArgs)
      expect(saySpy).toHaveBeenCalledWith('PONG! :wave:')
    })
  })

  describe('test', () => {
    it('returns true if the command is valid', async () => {
      expect(await test('ping')).toBeTruthy()
      expect(await test('  PING  ')).toBeTruthy()
    })

    it('returns false if the command is invalid', async () => {
      expect(await test('piiiing')).toBeFalsy()
      expect(await test('')).toBeFalsy()
      expect(await test('\n')).toBeFalsy()
    })
  })
})
