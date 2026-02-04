import { uniq } from 'lodash'
import { PropsWithChildren, useMemo } from 'react'

import { useFieldError } from '../../services/GraphQL'
import type { MutationError } from '../../types/graphql'
import { Snackbar } from './Snackbar'

interface Props {
  error?: Error | null | undefined
}

export const ErrorHandler = ({
  children,
  error: genericError,
}: PropsWithChildren<Props>) => {
  const error = (genericError || undefined) as unknown as
    | MutationError
    | undefined
  const globalErr = useFieldError(error, 'global')

  // If we have an error in a list of 'edge' results, it's likely
  // that all of the edges have the same error. Grab the first
  // error message and display it globally.
  const edgeError = useMemo(() => {
    if (error?.response?.errors?.[0]?.path?.[1] === 'edges') {
      return error?.response?.errors?.[0]?.message
    }
  }, [error?.response?.errors])

  const messages = (globalErr || edgeError)?.split('\n')
  // Remove duplicate errors.
  const message = uniq(messages).join('\n')

  return (
    <>
      {message ? <Snackbar message={message} severity={'error'} /> : null}

      {children}
    </>
  )
}
