import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  CreatePulseMemberInput,
  PulseMember,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreatePulseMemberMutationResponse {
  createPulseMember: PulseMember[]
}

const createPulseMemberMutationDocument = graphql(/* GraphQL */ `
  mutation CreatePulseMemberMutation(
    $pulseId: String!
    $input: [CreatePulseMemberInput!]
  ) {
    createPulseMember(pulseId: $pulseId, input: $input) {
      ...PulseMemberFragment
    }
  }
`)

interface CreatePulseMemberVariables {
  pulseId: string
  input: CreatePulseMemberInput[]
}

export const useCreatePulseMemberMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreatePulseMemberMutationResponse,
  Error,
  CreatePulseMemberVariables
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: CreatePulseMemberVariables) => {
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<CreatePulseMemberMutationResponse>(
        createPulseMemberMutationDocument,
        {
          ...variables,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['pulseMembers'],
      })
    },
  })
}
