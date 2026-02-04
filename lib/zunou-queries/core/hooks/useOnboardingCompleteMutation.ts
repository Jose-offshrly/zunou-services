import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  OnboardingCompleteInput,
  Organization,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface OnboardingCompleteResponse {
  onboardingComplete: Organization
}

const ONBOARDING_COMPLETE_MUTATION = graphql(/* GraphQL */ `
  mutation OnboardingComplete($input: OnboardingCompleteInput!) {
    onboardingComplete(input: $input) {
      ...OrganizationFragment
    }
  }
`)

export const useOnboardingCompleteMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  OnboardingCompleteResponse,
  Error,
  OnboardingCompleteInput
> => {
  const { getToken } = useAuthContext()

  return useMutation({
    mutationFn: async (input: OnboardingCompleteInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<OnboardingCompleteResponse>(
        ONBOARDING_COMPLETE_MUTATION,
        {
          input,
        },
      )
    },
  })
}
