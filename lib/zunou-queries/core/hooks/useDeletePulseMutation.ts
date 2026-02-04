import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DeletePulseResponse {
  deletePulse: boolean
}

const DELETE_PULSE_MUTATION = graphql(/* GraphQL */ `
  mutation DeletePulse($pulseId: String!) {
    deletePulse(pulseId: $pulseId)
  }
`)

export const useDeletePulseMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DeletePulseResponse,
  Error,
  { pulseId: string }
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ pulseId }: { pulseId: string }) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeletePulseResponse>(
        DELETE_PULSE_MUTATION,
        {
          pulseId,
        },
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['pulses'],
      })
      queryClient.invalidateQueries({
        queryKey: ['pulse', variables.pulseId],
      })
    },
  })
}
