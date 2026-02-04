import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { CreateEventInput, Event } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { ClientError } from 'graphql-request'

interface CreateEventResponse {
  createEvent: Event
}

const createEventMutationDocument = graphql(/* GraphQL */ `
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      ...EventFragment
    }
  }
`)

export const useCreateEventMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateEventResponse,
  ClientError,
  CreateEventInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateEventResponse>(
        createEventMutationDocument,
        {
          input,
        },
      )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['events'],
      })
    },
  })
}
