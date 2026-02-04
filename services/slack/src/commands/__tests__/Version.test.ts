import { help, run, test } from '~/commands/Version'
import { MiddlewareArgs, saySpy } from '~/tests/Mocks'

describe('Version', () => {
  describe('help', () => {
    it('returns a help message', async () => {
      const expected = [
        expect.stringMatching(/Replies with the current bot version/),
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

    it('returns the version', async () => {
      await run(middlewareArgs)
      expect(saySpy).toHaveBeenCalledWith(
        'The current version is unknown :point_up:',
      )
    })
  })

  describe('test', () => {
    it('returns true if the command is valid', async () => {
      expect(await test('version')).toBeTruthy()
      expect(await test('  VERSION  ')).toBeTruthy()
    })

    it('returns false if the command is invalid', async () => {
      expect(await test('veeeersiiion')).toBeFalsy()
      expect(await test('')).toBeFalsy()
      expect(await test('\n')).toBeFalsy()
    })
  })
})
