import { useMutation, UseMutationResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type {
  McpAuthorizationFlow,
  McpServer,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface StartMCPAuthorizationResponse {
  startMCPAuthorization: McpAuthorizationFlow
}

interface StartMCPAuthorizationInput {
  mcpServer: McpServer
  redirectUri?: string
}

const startMCPAuthorizationMutationDocument = graphql(/* GraphQL */ `
  mutation StartMCPAuthorization($mcpServer: MCPServer!, $redirectUri: String) {
    startMCPAuthorization(mcpServer: $mcpServer, redirectUri: $redirectUri) {
      authUrl
      state
      mcpUrl
      authServerInfo {
        authorizationEndpoint
        tokenEndpoint
        registrationEndpoint
        clientId
        scopesSupported
        responseTypesSupported
        grantTypesSupported
      }
    }
  }
`)

export const useStartMCPAuthorization = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  StartMCPAuthorizationResponse,
  Error,
  StartMCPAuthorizationInput
> => {
  const { getToken } = useAuthContext()

  return useMutation({
    mutationFn: async (input: StartMCPAuthorizationInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<StartMCPAuthorizationResponse>(
        startMCPAuthorizationMutationDocument,
        { mcpServer: input.mcpServer, redirectUri: input.redirectUri },
      )
    },
  })
}
