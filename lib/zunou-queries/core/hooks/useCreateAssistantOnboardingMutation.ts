import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  CreateAssistantOnboardingInput,
  Thread,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateAssistantOnboardingResponse {
  createAssistantOnboarding: Thread
}

const CREATE_ASSISTANT_ONBOARDING_MUTATION = graphql(/* GraphQL */ `
  mutation CreateAssistantOnboarding($input: CreateAssistantOnboardingInput!) {
    createAssistantOnboarding(input: $input) {
      id
    }
  }
`)

export const useCreateAssistantOnboardingMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateAssistantOnboardingResponse,
  Error,
  CreateAssistantOnboardingInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAssistantOnboardingInput) => {
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<CreateAssistantOnboardingResponse>(
        CREATE_ASSISTANT_ONBOARDING_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['threads'],
      })
    },
  })
}
