import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Widget } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { ID } from 'graphql-ws'

import { useOrganization } from '../../../../services/pulse/src/hooks/useOrganization'

interface DeleteWidgetResponse {
  widget: Widget
}

const deleteWidgetMutationDocument = graphql(/* GraphQL */ `
  mutation deleteWidget($widgetId: ID!) {
    deleteWidget(widgetId: $widgetId)
  }
`)

export const useDeleteWidgetMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<DeleteWidgetResponse, Error, ID> => {
  const { user, getToken } = useAuthContext()
  const { organizationId } = useOrganization()
  const queryClient = useQueryClient()

  return useMutation<DeleteWidgetResponse, Error, string>({
    mutationFn: async (widgetId: ID) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeleteWidgetResponse>(
        deleteWidgetMutationDocument,
        { widgetId },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['widgets', user?.id, organizationId],
      })
    },
  })
}
