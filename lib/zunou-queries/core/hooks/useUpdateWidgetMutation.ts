import { useMutation, UseMutationResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { UpdateWidgetInput, Widget } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateWidgetResponse {
  widget: Widget
}

const updateWidgetMutationDocument = graphql(/* GraphQL */ `
  mutation updateWidget($input: UpdateWidgetInput!) {
    updateWidget(input: $input) {
      ...WidgetFragment
    }
  }
`)

export const useUpdateWidgetMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateWidgetResponse,
  Error,
  UpdateWidgetInput
> => {
  const { getToken } = useAuthContext()

  return useMutation({
    mutationFn: async (input: UpdateWidgetInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateWidgetResponse>(
        updateWidgetMutationDocument,
        {
          input,
        },
      )
    },
  })
}
