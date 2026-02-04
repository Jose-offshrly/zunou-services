import { graphql } from '@zunou-graphql/core/gql'
import { SignInUserInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'

const SIGN_IN_USER_MUTATION = graphql(/* GraphQL */ `
  mutation SignInUser($input: SignInUserInput!) {
    signInUser(input: $input) {
      createdAt
      email
      emailVerifiedAt
      id
      name
      updatedAt
    }
  }
`)

export const signInUserMutation = async (
  endpoint: string,
  token: string | null,
  input: SignInUserInput,
) => {
  const data = await gqlClient(endpoint, token).request(SIGN_IN_USER_MUTATION, {
    input,
  })

  return data
}
