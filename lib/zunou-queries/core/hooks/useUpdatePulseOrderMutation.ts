import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Pulse, UpdatePulseOrderInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

import { useOrganization } from '../../../../services/pulse/src/hooks/useOrganization'

interface UpdatePulseOrderResponse {
  updatePulseOrder: Pulse[]
}

const UPDATE_PULSE_ORDER_MUTATION = graphql(/* GraphQL */ `
  mutation UpdatePulseOrder($input: [UpdatePulseOrderInput!]) {
    updatePulseOrder(input: $input) {
      ...PulseFragment
    }
  }
`)

export const useUpdatePulseOrderMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdatePulseOrderResponse,
  Error,
  UpdatePulseOrderInput[]
> => {
  const queryClient = useQueryClient()
  const { getToken } = useAuthContext()
  const { organizationId } = useOrganization()

  return useMutation({
    mutationFn: async (input: UpdatePulseOrderInput[]) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdatePulseOrderResponse>(
        UPDATE_PULSE_ORDER_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: ['pulses', organizationId],
      })
    },
  })
}
