import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface AutomationLogEntry {
  level: string
  message: string
  context?: string[]
}

interface AutomationRunLog {
  runAt: string
  logs: AutomationLogEntry[]
}

interface AutomationLog {
  id: string
  description: string
  properties: AutomationRunLog
  createdAt: string
  updatedAt: string
}

interface QueryResponse {
  automationLog: AutomationLog[]
}

interface Variables {
  strategyId: string
  [key: string]: unknown
}

const getAutomationLogQueryDocument = graphql(/* GraphQL */ `
  query GetAutomationLog($strategyId: String!) {
    automationLog(strategyId: $strategyId) {
      id
      description
      properties {
        runAt
        logs {
          level
          message
          context
        }
      }
      createdAt
      updatedAt
    }
  }
`) as TypedDocumentNode<QueryResponse, Variables>

export const useGetAutomationLogQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const response = useQuery({
    ...options,
    enabled: isAuthenticated,
    queryFn: async () => {
      if (!variables?.strategyId) {
        throw new Error('strategyId is required')
      }

      const token = await getToken()

      const result = gqlClient(coreUrl, token).request<
        QueryResponse,
        Variables
      >(getAutomationLogQueryDocument, variables as Variables)
      return result
    },
    queryKey: ['automationLog', variables?.strategyId],
  })

  return response
}
