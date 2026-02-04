import { acknowledgement } from '~/services/Slack'

describe('Slack', () => {
  describe('acknowledgement', () => {
    it('returns a random phrase', () => {
      const expected = expect.stringMatching(/^.+ @dave! :thumbsup:$/m)
      expect(acknowledgement('dave', 'create release for octokit')).toEqual(
        expected,
      )
    })
  })
})
