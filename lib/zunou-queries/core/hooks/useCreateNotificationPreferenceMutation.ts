import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

export type NotificationPreferenceScopeType = 'global' | 'pulse' | 'topic'
export type NotificationPreferenceMode = 'all' | 'mentions' | 'off'

export interface CreateNotificationPreferenceInput {
  scopeType: NotificationPreferenceScopeType
  scopeId?: string | null
  mode: NotificationPreferenceMode
}

export interface NotificationPreference {
  id: string
  scopeType: NotificationPreferenceScopeType
  scopeId: string | null
  mode: NotificationPreferenceMode
  createdAt: string
  updatedAt: string
}

interface CreateNotificationPreferenceMutationResponse {
  createNotificationPreference: NotificationPreference
}

const CREATE_NOTIFICATION_PREFERENCE_MUTATION_DOCUMENT = graphql(/* GraphQL */ `
  mutation CreateNotificationPreference(
    $input: CreateNotificationPreferenceInput!
  ) {
    createNotificationPreference(input: $input) {
      id
      scopeType
      scopeId
      mode
      createdAt
      updatedAt
    }
  }
`)

export const useCreateNotificationPreferenceMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateNotificationPreferenceMutationResponse,
  Error,
  CreateNotificationPreferenceInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateNotificationPreferenceInput) => {
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<CreateNotificationPreferenceMutationResponse>(
        CREATE_NOTIFICATION_PREFERENCE_MUTATION_DOCUMENT,
        { input },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notification-preferences'],
      })
    },
  })
}
