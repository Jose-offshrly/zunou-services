import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { TaskStatusType } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useRef } from 'react'

interface TaskStatusOrderInput {
  id: string
  position: number
}

interface UpdateTaskStatusOrderResponse {
  updateTaskStatusOrder: TaskStatusType[]
}

const updateTaskStatusOrderMutationDocument = graphql(/* GraphQL */ `
  mutation UpdateTaskStatusOrder($input: [TaskStatusOrderInput!]!) {
    updateTaskStatusOrder(input: $input) {
      id
      pulse_id
      label
      color
      position
      createdAt
      updatedAt
    }
  }
`)

export const useUpdateTaskStatusOrderMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateTaskStatusOrderResponse,
  Error,
  TaskStatusOrderInput[]
> => {
  const controller = new AbortController()
  const abortControllerRef = useRef<AbortController | null>(null)

  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: TaskStatusOrderInput[]) => {
      abortControllerRef.current?.abort()

      abortControllerRef.current = controller

      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
        controller.signal,
      ).request<UpdateTaskStatusOrderResponse>(
        updateTaskStatusOrderMutationDocument,
        {
          input,
        },
      )
    },
    onSuccess: async (_, variables) => {
      // Invalidate task statuses queries
      if (variables.length > 0) {
        // Get pulse_id from the first status (they should all be from the same pulse)
        // We'll need to refetch to get the pulse_id, or we can invalidate all
        await queryClient.invalidateQueries({
          queryKey: ['taskStatuses'],
        })
      }

      // Also invalidate tasks since status order might affect task display
      await queryClient.invalidateQueries({
        queryKey: ['tasks'],
      })
    },
  })
}
