import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { TopicPaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

export interface DeleteTopicInput {
  topicId: string
}

interface DeleteTopicResponse {
  deleteTopic: boolean
}

const deleteTopicMutationDocument = graphql(/* GraphQL */ `
  mutation DeleteTopic($input: DeleteTopicInput!) {
    deleteTopic(input: $input)
  }
`)

type DeleteTopicVariables = DeleteTopicInput & {
  pulseId?: string
  topicId: string
}

export const useDeleteTopicMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DeleteTopicResponse,
  Error,
  DeleteTopicVariables
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      pulseId: _pulseId,
      topicId,
    }: DeleteTopicVariables) => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request(
        deleteTopicMutationDocument,
        { input: { topicId } },
      )

      return result as DeleteTopicResponse
    },

    // Rollback if error
    onError: (_error, _variables, context) => {
      if (context?.previousTopics) {
        Object.entries(context.previousTopics).forEach(([key, data]) => {
          if (data !== undefined) {
            queryClient.setQueryData(JSON.parse(key), data)
          }
        })
      }
    },

    // Optimistic update
    onMutate: async (variables: DeleteTopicVariables) => {
      // Cancel all related queries to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: ['teamThreadTopics'],
      })

      // Find all matching queries and save their previous state
      const queryCache = queryClient.getQueryCache()
      const matchingQueries = queryCache.findAll({
        predicate: (query) => {
          const key = query.queryKey
          return (
            Array.isArray(key) &&
            key[0] === 'teamThreadTopics' &&
            (!variables.pulseId || key[1] === variables.pulseId)
          )
        },
      })

      const previousTopics: Record<string, TopicPaginator | undefined> = {}
      matchingQueries.forEach((query) => {
        const queryKey = JSON.stringify(query.queryKey)
        previousTopics[queryKey] = queryClient.getQueryData<TopicPaginator>(
          query.queryKey,
        )
      })

      // Optimistically remove the topic from all matching queries
      matchingQueries.forEach((query) => {
        queryClient.setQueryData<TopicPaginator>(query.queryKey, (old) => {
          if (!old) return old

          return {
            ...old,
            data: old.data.filter((topic) => topic.id !== variables.topicId),
            paginatorInfo: {
              ...old.paginatorInfo,
              count: Math.max(0, old.paginatorInfo.count - 1),
              total: Math.max(0, old.paginatorInfo.total - 1),
            },
          }
        })
      })

      return { previousTopics }
    },
    onSuccess: (_, variables) => {
      // Invalidate team thread topics query to refetch updated topics
      queryClient.invalidateQueries({
        queryKey: ['teamThreadTopics', variables.pulseId],
      })

      // Also invalidate team thread messages since deleting a topic may affect messages
      queryClient.invalidateQueries({
        queryKey: ['teamThreadMessages', variables.pulseId, variables.topicId],
      })
    },
  })
}
