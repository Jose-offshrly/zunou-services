import type {
  InvalidateQueryFilters,
  UseMutationResult,
} from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateCheckoutSessionResponse {
  createCheckoutSession: {
    url: string
  }
}

const CREATE_CHECKOUT_SESSION_MUTATION = graphql(/* GraphQL */ `
  mutation CreateCheckoutSession($price_id: String!, $quantity: Int!) {
    createCheckoutSession(price_id: $price_id, quantity: $quantity) {
      url
    }
  }
`)

export const useCreateCheckoutSessionMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateCheckoutSessionResponse,
  Error,
  { price_id: string; quantity: number }
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ price_id, quantity }) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateCheckoutSessionResponse>(
        CREATE_CHECKOUT_SESSION_MUTATION,
        {
          price_id,
          quantity,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['billing'] as InvalidateQueryFilters)
    },
  })
}
