import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  OnboardingGenerateSlackInstallUriInput,
  SlackInstallUri,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface OnboardingGenerateSlackInstallUriResponse {
  onboardingGenerateSlackInstallUri: SlackInstallUri
}

const ONBOARDING_GENERATE_SLACK_INSTALL_URI_MUTATION = graphql(/* GraphQL */ `
  mutation OnboardingGenerateSlackInstallUri(
    $input: OnboardingGenerateSlackInstallUriInput!
  ) {
    onboardingGenerateSlackInstallUri(input: $input) {
      uri
    }
  }
`)

export const useOnboardingGenerateSlackInstallUriMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  OnboardingGenerateSlackInstallUriResponse,
  Error,
  OnboardingGenerateSlackInstallUriInput
> => {
  const { getToken } = useAuthContext()
  return useMutation({
    mutationFn: async (input: OnboardingGenerateSlackInstallUriInput) => {
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<OnboardingGenerateSlackInstallUriResponse>(
        ONBOARDING_GENERATE_SLACK_INSTALL_URI_MUTATION,
        {
          input,
        },
      )
    },
  })
}
