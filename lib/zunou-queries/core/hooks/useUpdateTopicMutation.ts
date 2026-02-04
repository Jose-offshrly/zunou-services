import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Topic, TopicPaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

export interface UpdateTopicInput {
  topicId: string
  name?: string
}

interface UpdateTopicResponse {
  updateTopic: Topic
}

const updateTopicMutationDocument = graphql(/* GraphQL */ `
  mutation UpdateTopic($input: UpdateTopicInput!) {
    updateTopic(input: $input) {
      id
      name
      createdBy
      createdAt
      updatedAt
      creator {
        id
        name
      }
      teamThread {
        id
      }
    }
  }
`)

type UpdateTopicVariables = UpdateTopicInput & {
  pulseId?: string
}

export const useUpdateTopicMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateTopicResponse,
  Error,
  UpdateTopicVariables
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      pulseId: _pulseId,
      ...input
    }: UpdateTopicVariables) => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request(
        updateTopicMutationDocument,
        { input },
      )

      return result as UpdateTopicResponse
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
    onMutate: async (variables: UpdateTopicVariables) => {
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

      // Optimistically update the topic in all matching queries
      matchingQueries.forEach((query) => {
        queryClient.setQueryData<TopicPaginator>(query.queryKey, (old) => {
          if (!old) return old

          return {
            ...old,
            data: old.data.map((topic) =>
              topic.id === variables.topicId
                ? {
                    ...topic,
                    name: variables.name ?? topic.name,
                    updatedAt: new Date().toISOString(),
                  }
                : topic,
            ),
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
    },
  })
}
