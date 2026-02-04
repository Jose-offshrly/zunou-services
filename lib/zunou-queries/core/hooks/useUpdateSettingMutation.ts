import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Setting, UpdateSettingInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

import { useOrganization } from '../../../../services/pulse/src/hooks/useOrganization'

interface UpdateSettingResponse {
  updateSetting: Setting
}

const updateSettingMutationDocument = graphql(/* GraphQL */ `
  mutation updateSetting($input: UpdateSettingInput!) {
    updateSetting(input: $input) {
      ...SettingFragment
    }
  }
`)

export const useUpdateSettingMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateSettingResponse,
  Error,
  UpdateSettingInput
> => {
  const { user, getToken } = useAuthContext()
  const { organizationId } = useOrganization()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateSettingInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateSettingResponse>(
        updateSettingMutationDocument,
        {
          input,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['setting', user?.id, organizationId],
      })
    },
  })
}
