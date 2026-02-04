import { slashCommand } from '~/services/Constants'

/**
 * @public
 *
 * Returns an acknowledgement message confirming that we are working on something.
 * @param {string} userName    The name of the user we are acknowledging.
 * @param {string} commandText The command that they executed.
 * @returns {string} An acknowledgement phrase.
 */
export const acknowledgement = (
  userName: string,
  commandText: string,
): string => {
  const phrases = [
    'You got it',
    'Sure thing',
    'Roger that',
    'No problemo',
    'On the case',
    "That's a big 10-4",
    'Copy that',
  ]
  const phrase = phrases[Math.floor(Math.random() * phrases.length)]
  return `> ${slashCommand} ${commandText.trim()}\n${phrase} @${userName}! :thumbsup:`
}
