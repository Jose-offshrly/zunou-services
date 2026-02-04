/**
 * Converts the given number into a human-readable string.
 *
 * @param num - The number to format.
 *
 * @returns A string representing the number.
 */
export const humanizeNumber = (num: number) => {
  let suffix = ''
  let formatted = num

  if (num >= 1000000) {
    suffix = 'M'
    formatted = round(num / 1000000, 1)
  } else if (num >= 10000) {
    suffix = 'k'
    formatted = round(num / 1000, 1)
  }

  return `${formatted.toLocaleString()}${suffix}`
}

export const round = (num: number, precision: number) => {
  const multiplier = Math.pow(10, precision)
  return Math.round(num * multiplier) / multiplier
}
