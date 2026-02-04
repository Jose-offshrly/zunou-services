import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  OnboardingAgreeToTermsInput,
  Organization,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface OnboardingAgreeToTermsResponse {
  onboardingAgreeToTerms: Organization
}

const ONBOARDING_AGREE_TO_TERMS_MUTATION = graphql(/* GraphQL */ `
  mutation OnboardingAgreeToTerms($input: OnboardingAgreeToTermsInput!) {
    onboardingAgreeToTerms(input: $input) {
      ...OrganizationFragment
    }
  }
`)

export const useOnboardingAgreeToTermsMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  OnboardingAgreeToTermsResponse,
  Error,
  OnboardingAgreeToTermsInput
> => {
  const { getToken } = useAuthContext()
  return useMutation({
    mutationFn: async (input: OnboardingAgreeToTermsInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<OnboardingAgreeToTermsResponse>(
        ONBOARDING_AGREE_TO_TERMS_MUTATION,
        {
          input,
        },
      )
    },
  })
}
