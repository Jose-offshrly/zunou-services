import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  CreateTopicInput,
  Topic,
  TopicReferenceType,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateTopicResponse {
  createTopic: Topic
}

const createTopicMutationDocument = graphql(/* GraphQL */ `
  mutation CreateTopic($input: CreateTopicInput!) {
    createTopic(input: $input) {
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
      thread {
        id
      }
    }
  }
`)

export const useCreateTopicMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateTopicResponse,
  Error,
  CreateTopicInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ ...input }: CreateTopicInput) => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request(
        createTopicMutationDocument,
        { input },
      )

      console.log([
        'topics',
        input.referenceType === TopicReferenceType.Insights
          ? 'PULSE_CHAT'
          : 'TEAM_CHAT',
        input.pulseId,
        input.organizationId,
      ])

      return result as CreateTopicResponse
    },
    onSuccess: (_, variables) => {
      // Invalidate team thread topics query to refetch updated topics
      queryClient.invalidateQueries({
        queryKey: [
          'topics',
          variables.referenceType === TopicReferenceType.Insights
            ? 'PULSE_CHAT'
            : 'TEAM_CHAT',
          variables.pulseId,
          variables.organizationId,
        ],
      })
    },
  })
}
