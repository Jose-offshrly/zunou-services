import { humanizeNumber, round } from './Number'

/**
 * Converts the given number of cents into a human-readable string.
 *
 * @param cents - The number of cents to format.
 *
 * @returns A string representing the number of cents.
 */
export const humanizeCents = (
  cents: number | undefined,
  options = { shorten: true },
): string => {
  let dollars = options.shorten
    ? humanizeNumber(round((cents || 0) / 100, 2))
    : round((cents || 0) / 100, 2).toLocaleString()
  if (dollars.endsWith('.0')) {
    dollars = `${dollars}0`
  } else if (dollars.match(/\.\d$/)) {
    dollars = `${dollars}0`
  }

  return `$${dollars}`
}

/**
 * Returns the given total cents amount formatted as a dollar / cents string.
 *
 * @param totalCents - The number to format.
 *
 * @returns the formatted dollar / cent amount.
 */
export const formatCents = (totalCents: number | undefined) => {
  if (totalCents === undefined) {
    return '$0.00'
  }

  let cents = `${totalCents}`
  let dollars = 0

  if (totalCents >= 100) {
    cents = `${totalCents % 100}`
    dollars = (totalCents - (totalCents % 100)) / 100
  }

  if (cents.length === 1) {
    cents = `0${cents}`
  }

  return `$${dollars}.${cents}`
}
