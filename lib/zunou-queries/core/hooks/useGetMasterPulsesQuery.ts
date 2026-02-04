import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { MasterPulsePaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  masterPulses: MasterPulsePaginator
}

const getMasterPulsesQueryDocument = graphql(/* GraphQL */ `
  query GetMasterPulses {
    masterPulses {
      data {
        ...MasterPulseFragment
      }
      paginatorInfo {
        ...PaginatorInfoFragment
      }
    }
  }
`)

export const useGetMasterPulsesQuery = ({
  coreUrl,
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const response = useQuery({
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        getMasterPulsesQueryDocument,
      )

      return result
    },
    queryKey: ['masterPulses'],
  })

  return response
}
