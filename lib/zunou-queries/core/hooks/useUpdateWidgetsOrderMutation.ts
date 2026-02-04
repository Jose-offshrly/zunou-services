import { useMutation, UseMutationResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Widget, WidgetOrderInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateWidgetsOrderResponse {
  widgets: Widget[]
}

const updateWidgetsOrderMutationDocument = graphql(/* GraphQL */ `
  mutation updateWidgetsOrder($input: [WidgetOrderInput!]) {
    updateWidgetOrder(input: $input) {
      ...WidgetFragment
    }
  }
`)

export const useUpdateWidgetsOrderMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateWidgetsOrderResponse,
  Error,
  WidgetOrderInput[]
> => {
  const { getToken } = useAuthContext()

  return useMutation({
    mutationFn: async (input: WidgetOrderInput[]) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateWidgetsOrderResponse>(
        updateWidgetsOrderMutationDocument,
        {
          input,
        },
      )
    },
  })
}
