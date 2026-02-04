import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Pulse, UpdatePulseInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdatePulseResponse {
  updatePulse: Pulse
}

const UPDATE_PULSE_MUTATION = graphql(/* GraphQL */ `
  mutation UpdatePulse($input: UpdatePulseInput!) {
    updatePulse(input: $input) {
      ...PulseFragment
    }
  }
`)

export const useUpdatePulseMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdatePulseResponse,
  Error,
  UpdatePulseInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdatePulseInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdatePulseResponse>(
        UPDATE_PULSE_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['pulse'],
      })
      queryClient.invalidateQueries({
        queryKey: ['pulses'],
      })
    },
  })
}
