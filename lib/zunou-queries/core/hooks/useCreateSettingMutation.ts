import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { CreateSettingInput, Setting } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

import { useOrganization } from '../../../../services/pulse/src/hooks/useOrganization'

interface CreateSettingResponse {
  createSetting: Setting
}

const CREATE_SETTING_MUTATION = graphql(/* GraphQL */ `
  mutation CreateSetting($input: CreateSettingInput!) {
    createSetting(input: $input) {
      ...SettingFragment
    }
  }
`)

export const useCreateSettingMutation = ({
  coreUrl,
}: {
  coreUrl: string
}): UseMutationResult<CreateSettingResponse, Error, CreateSettingInput> => {
  const { user, getToken } = useAuthContext()
  const { organizationId } = useOrganization()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSettingInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateSettingResponse>(
        CREATE_SETTING_MUTATION,
        { input },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['setting', user?.id, organizationId],
      })
    },
  })
}
