import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { PulseMember } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdatePulseLastVisitedResponse {
  updatePulseLastVisited: PulseMember
}

interface UpdatePulseLastVisitedInput {
  pulseId: string
  userId: string
}

const UPDATE_PULSE_LAST_VISITED_MUTATION = graphql(/* GraphQL */ `
  mutation UpdatePulseLastVisited($pulseId: String!, $userId: String!) {
    updatePulseLastVisited(pulseId: $pulseId, userId: $userId) {
      ...PulseMemberFragment
    }
  }
`)

export const useUpdatePulseLastVisitedMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdatePulseLastVisitedResponse,
  Error,
  UpdatePulseLastVisitedInput
> => {
  const { getToken } = useAuthContext()

  return useMutation({
    mutationFn: async (input: UpdatePulseLastVisitedInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdatePulseLastVisitedResponse>(
        UPDATE_PULSE_LAST_VISITED_MUTATION,
        {
          pulseId: input.pulseId,
          userId: input.userId,
        },
      )
    },
  })
}
