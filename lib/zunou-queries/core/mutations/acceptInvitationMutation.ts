import { graphql } from '@zunou-graphql/core/gql'
import { AcceptInvitationInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'

const acceptInvitationMutationDocument = graphql(/* GraphQL */ `
  mutation AcceptInvitation($input: AcceptInvitationInput!) {
    acceptInvitation(input: $input) {
      id
      name
    }
  }
`)

export const acceptInvitationMutation = async (
  endpoint: string,
  token: string | null,
  input: AcceptInvitationInput,
) => {
  const data = await gqlClient(endpoint, token).request(
    acceptInvitationMutationDocument,
    {
      input,
    },
  )

  return data
}
