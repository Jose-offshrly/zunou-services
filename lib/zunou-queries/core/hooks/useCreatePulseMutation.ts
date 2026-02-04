import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { ProvisionPulseInput, Pulse } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreatePulseMutationResponse {
  createPulse: Pulse
}

const createPulseMutationDocument = graphql(/* GraphQL */ `
  mutation CreatePulse($input: ProvisionPulseInput!) {
    createPulse(input: $input) {
      ...PulseFragment
    }
  }
`)

export const useCreatePulseMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreatePulseMutationResponse,
  Error,
  ProvisionPulseInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ProvisionPulseInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreatePulseMutationResponse>(
        createPulseMutationDocument,
        {
          input,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['pulses'],
      })
    },
  })
}
