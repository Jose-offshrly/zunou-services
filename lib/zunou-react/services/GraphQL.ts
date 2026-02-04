import { useMemo } from 'react'

import {
  MutationError,
  ResponseError,
  ValidationErrors,
} from '../types/graphql'

// A hook to return an error or a specific field.
export const useFieldError = (
  error: MutationError | null | undefined,
  field: string,
): string | undefined => {
  const errs = useFieldErrors(error)
  const result = ((errs || {})[field] || [])[0]
  return result
}

// A hook to return a hash of errors keyed by field name.
export const useFieldErrors = (
  genericError: Error | null | undefined,
): ValidationErrors | undefined => {
  const error = (genericError || undefined) as unknown as
    | MutationError
    | undefined

  const messages: ValidationErrors | undefined = useMemo(() => {
    if (!error) {
      return
    }

    const msgs: ValidationErrors = {}
    error?.response?.errors?.forEach((er: ResponseError) => {
      const field = Object.keys(er?.extensions?.validation || {})[0]
      if (er?.message && !field) {
        msgs['global'] = [er?.message]
        return
      }

      const humanized = field?.split('.').reverse()[0] // Turn 'input.name' into just 'name'.
      if (field && !msgs[humanized]) {
        const spacedField = field
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .toLowerCase()
        msgs[humanized] = er.extensions.validation[field].map((msg) =>
          msg.replace(new RegExp(`The ${spacedField} (field )?`), ''),
        )
      }
    })

    return msgs
  }, [error])

  return messages
}
