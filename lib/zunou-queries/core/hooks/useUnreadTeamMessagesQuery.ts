import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Pulse } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UnreadTeamMessagesResponse {
  unreadTeamMessages: Pulse[]
}

interface UnreadTeamMessagesVariables {
  organizationId: string
}

const unreadTeamMessagesQueryDocument = graphql(/* GraphQL */ `
  query UnreadTeamMessages($organizationId: String!) {
    unreadTeamMessages(organizationId: $organizationId) {
      id
      name
      description
      created_at
      updated_at
      category
      unread_team_messages {
        id
      }
    }
  }
`) as TypedDocumentNode<UnreadTeamMessagesResponse, UnreadTeamMessagesVariables>

export const useUnreadTeamMessagesQuery = ({
  coreUrl,
  variables,
}: QueryOptions): UseQueryResult<Pulse[]> => {
  const { getToken } = useAuthContext()

  return useQuery({
    queryFn: async () => {
      const token = await getToken()

      const organizationId = variables?.organizationId as string
      const data = await gqlClient(
        coreUrl,
        token,
      ).request<UnreadTeamMessagesResponse>(unreadTeamMessagesQueryDocument, {
        organizationId,
      })
      return data.unreadTeamMessages
    },
    queryKey: ['unreadTeamMessages', variables?.organizationId],
  })
}
