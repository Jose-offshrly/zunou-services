import { graphql } from '@zunou-graphql/core/gql'
import { User } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'

interface QueryResponse {
  me?: User
}

const GET_ME_QUERY = graphql(/* GraphQL */ `
  query MeQuery {
    me {
      ...UserFragment
      organizationUsers {
        data {
          ...OrganizationUserFragment
        }
      }
    }
  }
`)

export const getMeQuery = async (endpoint: string, token: string | null) => {
  const data = await gqlClient(endpoint, token).request<QueryResponse>(
    GET_ME_QUERY,
  )

  return data
}
