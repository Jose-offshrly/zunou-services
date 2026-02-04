import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Task, UpdateTaskInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useCallback, useRef } from 'react'

interface UpdateTaskResponse {
  updateTask: Task
}

interface MutationCallbacks {
  onSuccess?: () => void
  onError?: () => void
  onSettled?: (
    data: { result: UpdateTaskResponse; taskId: string } | null | undefined,
    error: Error | null,
    variables: UpdateTaskInput,
  ) => void
}

const updateTaskMutationDocument = graphql(/* GraphQL */ `
  mutation UpdateTask($input: UpdateTaskInput!) {
    updateTask(input: $input) {
      ...TaskFragment
    }
  }
`)

export const useUpdateTaskMutation = ({ coreUrl }: MutationOptions) => {
  // Track abort controllers per task ID to allow concurrent updates on different tasks
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())
  // Track latest mutation ID per task to handle race conditions within same task
  const latestMutationIdsRef = useRef<Map<string, number>>(new Map())
  // Track per-task callbacks to support concurrent mutations
  const callbacksRef = useRef<Map<string, MutationCallbacks>>(new Map())

  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const taskId = input.taskId

      // Abort any existing mutation for the SAME task only
      abortControllersRef.current.get(taskId)?.abort()

      const controller = new AbortController()
      abortControllersRef.current.set(taskId, controller)

      const currentId = Date.now()
      latestMutationIdsRef.current.set(taskId, currentId)

      const token = await getToken()

      try {
        const result = await gqlClient(
          coreUrl,
          token,
          controller.signal,
        ).request<UpdateTaskResponse>(updateTaskMutationDocument, {
          input,
        })

        return { currentId, result, taskId }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return null
        }

        throw err
      } finally {
        // Clean up the abort controller for this task
        if (abortControllersRef.current.get(taskId) === controller) {
          abortControllersRef.current.delete(taskId)
        }
      }
    },
    onError: (_error, variables) => {
      // Call per-task onError callback
      callbacksRef.current.get(variables.taskId)?.onError?.()
    },
    onSettled: (data, error, variables) => {
      // Call per-task onSettled callback
      callbacksRef.current
        .get(variables.taskId)
        ?.onSettled?.(data, error, variables)
      // Clean up the callback
      callbacksRef.current.delete(variables.taskId)
    },
    onSuccess: async (data, variables) => {
      if (!data) return

      const { currentId, taskId } = data

      // Only invalidate if this is the latest mutation for this specific task
      if (currentId !== latestMutationIdsRef.current.get(taskId)) return

      // Clean up the mutation ID tracking
      latestMutationIdsRef.current.delete(taskId)

      // Call per-task onSuccess callback
      callbacksRef.current.get(variables.taskId)?.onSuccess?.()

      await queryClient.invalidateQueries({
        exact: false,
        queryKey: ['tasks'],
      })
    },
  })

  // Wrapper that stores callbacks per-task before calling mutate
  const mutate = useCallback(
    (input: UpdateTaskInput, callbacks?: MutationCallbacks) => {
      if (callbacks) {
        callbacksRef.current.set(input.taskId, callbacks)
      }
      mutation.mutate(input)
    },
    [mutation],
  )

  return {
    ...mutation,
    mutate,
  }
}
