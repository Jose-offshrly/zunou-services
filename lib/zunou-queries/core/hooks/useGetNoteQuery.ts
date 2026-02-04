import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Note } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  note: Note
}

const getNoteQueryDocument = graphql(/* GraphQL */ `
  query GetNote($noteId: ID!) {
    note(noteId: $noteId) {
      id
      title
      content
      labels {
        id
        name
        color
      }
      pinned
      updatedAt
      files {
        id
        path
        file_name
        type
        entity_type
        entity_id
        organization_id
        pulse_id
        created_at
        updated_at
        url
        size
      }
      dataSource {
        id
        name
      }
    }
  }
`)

export const useGetNoteQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  return useQuery({
    ...options,
    enabled: isAuthenticated && !!variables?.noteId,
    queryFn: async () => {
      const token = await getToken()
      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        getNoteQueryDocument,
        variables,
      )
      return result
    },
    queryKey: ['notes', variables?.noteId],
    retry: false,
  })
}
