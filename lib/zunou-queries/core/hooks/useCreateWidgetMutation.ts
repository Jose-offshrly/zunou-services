import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { CreateWidgetInput, Widget } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateWidgetResponse {
  createWidget: Widget
}

const CREATE_WIDGET_MUTATION = graphql(/* GraphQL */ `
  mutation CreateWidget($input: CreateWidgetInput!) {
    createWidget(input: $input) {
      ...WidgetFragment
    }
  }
`)

export const useCreateWidgetMutation = ({
  coreUrl,
}: {
  coreUrl: string
}): UseMutationResult<CreateWidgetResponse, Error, CreateWidgetInput> => {
  const { getToken } = useAuthContext()

  return useMutation({
    mutationFn: async (input: CreateWidgetInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateWidgetResponse>(
        CREATE_WIDGET_MUTATION,
        { input },
      )
    },
  })
}
