import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateSettingInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

const CREATE_VITALS_SETTINGS_MUTATION: TypedDocumentNode<
  CreateVitalsSettingsResponse,
  { input: CreateSettingInput }
> = `
  mutation CreateVitalsSettings($input: CreateSettingInput!) {
    createSetting(input: $input) {
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
  CreateVitalsSettingsResponse,
  { input: CreateSettingInput }
>

interface CreateVitalsSettingsResponse {
  createSetting: {
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

export const useCreateVitalsSettingsMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateVitalsSettingsResponse,
  Error,
  { input: CreateSettingInput }
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: { input: CreateSettingInput }) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateVitalsSettingsResponse>(
        CREATE_VITALS_SETTINGS_MUTATION,
        variables,
      )
    },
    onSuccess: ({ createSetting }) => {
      queryClient.invalidateQueries({
        queryKey: ['vitalsSettings', createSetting.userId],
      })
    },
  })
}
