import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  CreateEventInstanceInput,
  EventInstance,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { ClientError } from 'graphql-request'

interface CreateEventInstanceResponse {
  createEventInstance: EventInstance
}

const createEventInstanceMutationDocument = graphql(/* GraphQL */ `
  mutation CreateEventInstance($input: CreateEventInstanceInput!) {
    createEventInstance(input: $input) {
      id
      event_id
      pulse_id
      local_description
      priority
      created_at
      updated_at
    }
  }
`)

export const useCreateEventInstanceMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateEventInstanceResponse,
  ClientError,
  CreateEventInstanceInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateEventInstanceInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateEventInstanceResponse>(
        createEventInstanceMutationDocument,
        {
          input,
        },
      )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['eventInstances'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['events'],
      })
    },
  })
}
