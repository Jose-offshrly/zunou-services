import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  OnboardingConfirmSlackInput,
  Organization,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface OnboardingConfirmSlackResponse {
  onboardingConfirmSlack: Organization
}

const ONBOARDING_CONFIRM_SLACK_MUTATION = graphql(/* GraphQL */ `
  mutation OnboardingConfirmSlack($input: OnboardingConfirmSlackInput!) {
    onboardingConfirmSlack(input: $input) {
      ...OrganizationFragment
    }
  }
`)

export const useOnboardingConfirmSlackMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  OnboardingConfirmSlackResponse,
  Error,
  OnboardingConfirmSlackInput
> => {
  const { getToken } = useAuthContext()
  return useMutation({
    mutationFn: async (input: OnboardingConfirmSlackInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<OnboardingConfirmSlackResponse>(
        ONBOARDING_CONFIRM_SLACK_MUTATION,
        {
          input,
        },
      )
    },
  })
}
