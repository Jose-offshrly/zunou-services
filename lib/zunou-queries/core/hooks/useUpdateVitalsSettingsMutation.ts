import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UpdateSettingInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

const UPDATE_VITALS_SETTINGS_MUTATION: TypedDocumentNode<
  UpdateVitalsSettingsResponse,
  { input: UpdateSettingInput }
> = `
  mutation UpdateVitalsSettings($input: UpdateSettingInput!) {
    updateSetting(input: $input) {
      id
      userId
      organizationId
      color
      metadata {
        fileKey
        fileName
      }
      theme
    }
  }
` as unknown as TypedDocumentNode<
  UpdateVitalsSettingsResponse,
  { input: UpdateSettingInput }
>

interface UpdateVitalsSettingsResponse {
  updateSetting: {
    id: string
    userId: string
    organizationId: string
    color: string
    metadata: {
      fileKey?: string
      fileName?: string
    }
    theme: string
  }
}

export const useUpdateVitalsSettingsMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateVitalsSettingsResponse,
  Error,
  { input: UpdateSettingInput }
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: { input: UpdateSettingInput }) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateVitalsSettingsResponse>(
        UPDATE_VITALS_SETTINGS_MUTATION,
        variables,
      )
    },
    onSuccess: ({ updateSetting }) => {
      queryClient.invalidateQueries({
        queryKey: ['vitalsSettings', updateSetting.userId],
      })
    },
  })
}
