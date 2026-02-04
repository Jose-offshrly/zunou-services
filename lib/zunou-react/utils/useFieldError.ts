import { MutationError } from '@zunou-react/types/graphql'
import { FieldError } from 'react-hook-form'

export type ErrorType = MutationError | FieldError | null

export const useFieldError = ({
  error,
  fieldName,
}: {
  error?: ErrorType
  fieldName: string
}): string | undefined => {
  if (!error) return undefined

  // Handle MutationError
  if ('name' in error && error.name === fieldName) {
    return error.message
  }

  // Handle FieldError
  if ('message' in error) {
    return error.message
  }

  return undefined
}
