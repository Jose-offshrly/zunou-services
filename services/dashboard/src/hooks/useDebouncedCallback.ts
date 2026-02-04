import { debounce } from 'lodash'
import { useCallback } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useDebouncedCallback = <T extends (...args: any[]) => void>(
  callback: T,
  delay = 500,
) => {
  return useCallback(debounce(callback, delay), [callback, delay])
}
