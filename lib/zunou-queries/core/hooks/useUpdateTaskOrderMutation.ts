import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Task, TaskOrderInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useRef } from 'react'

interface UpdateTaskOrderResponse {
  updateTask: Task
}

const updateTaskOrderMutationDocument = graphql(/* GraphQL */ `
  mutation UpdateTaskOrder($input: [TaskOrderInput!]) {
    updateTaskOrder(input: $input) {
      ...TaskFragment
    }
  }
`)

export const useUpdateTaskOrderMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateTaskOrderResponse,
  Error,
  TaskOrderInput[]
> => {
  const controller = new AbortController()
  const abortControllerRef = useRef<AbortController | null>(null)

  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: TaskOrderInput[]) => {
      abortControllerRef.current?.abort()

      abortControllerRef.current = controller

      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
        controller.signal,
      ).request<UpdateTaskOrderResponse>(updateTaskOrderMutationDocument, {
        input,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['tasks'],
      })
    },
  })
}
