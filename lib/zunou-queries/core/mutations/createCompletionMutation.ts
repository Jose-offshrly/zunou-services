import { graphql } from '@zunou-graphql/core/gql'
import { CreateCompletionInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'

const CREATE_COMPLETION_MUTATION = graphql(/* GraphQL */ `
  mutation CreateCompletionBase($input: CreateCompletionInput!) {
    createCompletion(input: $input) {
      id
      content
    }
  }
`)

export const createCompletionMutation = async (
  endpoint: string,
  token: string | null,
  input: CreateCompletionInput,
) => {
  const data = await gqlClient(endpoint, token).request(
    CREATE_COMPLETION_MUTATION,
    {
      input,
    },
  )

  return data
}
