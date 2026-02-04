import { useMutation, UseMutationResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { McpCallbackResponse } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CompleteMCPAuthorizationResponse {
  completeMCPAuthorization: McpCallbackResponse
}

interface CompleteMCPAuthorizationInput {
  code: string
  state: string
}

const completeMCPAuthorizationMutationDocument = graphql(/* GraphQL */ `
  mutation CompleteMCPAuthorization($code: String!, $state: String!) {
    completeMCPAuthorization(code: $code, state: $state) {
      success
      message
      tokenData {
        mcpUrl
        accessToken
        tokenType
        expiresIn
        refreshToken
        scope
      }
    }
  }
`)

export const useCompleteMCPAuthorization = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CompleteMCPAuthorizationResponse,
  Error,
  CompleteMCPAuthorizationInput
> => {
  const { getToken } = useAuthContext()

  return useMutation({
    mutationFn: async (input: CompleteMCPAuthorizationInput) => {
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<CompleteMCPAuthorizationResponse>(
        completeMCPAuthorizationMutationDocument,
        { code: input.code, state: input.state },
      )
    },
  })
}
