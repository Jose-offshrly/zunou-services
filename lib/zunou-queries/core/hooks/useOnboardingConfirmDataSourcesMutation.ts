import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  DataSource,
  OnboardingConfirmDataSourcesInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface OnboardingConfirmDataSourcesResponse {
  onboardingConfirmDataSources: {
    data: DataSource[]
  }
}

const ONBOARDING_CONFIRM_DATA_SOURCES_MUTATION = graphql(/* GraphQL */ `
  mutation OnboardingConfirmDataSources(
    $input: OnboardingConfirmDataSourcesInput!
  ) {
    onboardingConfirmDataSources(input: $input) {
      data {
        ...DataSourceFragment
      }
    }
  }
`)

export const useOnboardingConfirmDataSourcesMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  OnboardingConfirmDataSourcesResponse,
  Error,
  OnboardingConfirmDataSourcesInput
> => {
  const { getToken } = useAuthContext()
  return useMutation({
    mutationFn: async (input: OnboardingConfirmDataSourcesInput) => {
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<OnboardingConfirmDataSourcesResponse>(
        ONBOARDING_CONFIRM_DATA_SOURCES_MUTATION,
        {
          input,
        },
      )
    },
  })
}
