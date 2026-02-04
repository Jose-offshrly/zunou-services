import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { ID } from 'graphql-ws'

interface DeleteIntegrationResponse {
  deleteIntegration: boolean
}

const deleteIntegrationDocument = graphql(/* GraphQL */ `
  mutation deleteIntegration($integrationId: ID!) {
    deleteIntegration(integrationId: $integrationId)
  }
`)

export const useDeleteIntegrationMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DeleteIntegrationResponse,
  Error,
  { integrationId: string }
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ integrationId }: { integrationId: ID }) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeleteIntegrationResponse>(
        deleteIntegrationDocument,
        {
          integrationId,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['meetings'],
      })
    },
  })
}
