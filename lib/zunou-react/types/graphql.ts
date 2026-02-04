import { GraphQLError } from 'graphql'

export type ValidationErrors = Record<string, string[]>

export interface ResponseError extends GraphQLError {
  extensions: {
    validation: ValidationErrors
  }
}

export interface MutationError {
  message: string
  name: string
  response?: {
    errors: ResponseError[]
  }
}
