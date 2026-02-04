import { snakeCase, startCase } from 'lodash'

export const humanizeString = (
  candidate: string | undefined,
): string | undefined => {
  if (candidate === undefined) {
    return candidate
  }

  return startCase(snakeCase(candidate).replace('_', ' '))
}
