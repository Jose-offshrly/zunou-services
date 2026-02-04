import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { CreateNoteInput, Note } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateNoteResponse {
  createNote: Note
}

interface NotesQueryData {
  notes: Note[]
}

const createNoteMutationDocument = graphql(/* GraphQL */ `
  mutation CreateNote($input: CreateNoteInput!) {
    createNote(input: $input) {
      id
      title
      content
      labels {
        id
        name
        color
      }
      pinned
      updatedAt
      files {
        id
        path
        file_name
        type
        entity_type
        entity_id
        organization_id
        pulse_id
        created_at
        updated_at
      }
    }
  }
`)

export const useCreateNotesMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateNoteResponse,
  Error,
  CreateNoteInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateNoteInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateNoteResponse>(
        createNoteMutationDocument,
        {
          input,
        },
      )
    },
    onError: (_, __, context) => {
      if (context?.previousNotes) {
        context.previousNotes.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onMutate: async (input: CreateNoteInput) => {
      await queryClient.cancelQueries({ queryKey: ['notes'] })

      const previousNotes = queryClient.getQueriesData({ queryKey: ['notes'] })

      const tempNote: Note = {
        content: input.content || '',
        id: `temp-${Date.now()}`,
        labels: input.labels
          ? input.labels.map((labelName) => ({
              color: undefined,
              id: '',
              name: labelName,
            }))
          : [],
        pinned: input.pinned || false,
        position: '0',
        title: input.title,
        updatedAt: new Date().toISOString(),
      }

      queryClient.setQueriesData(
        { queryKey: ['notes'] },
        (old: NotesQueryData | undefined) => {
          if (!old?.notes) return old

          return {
            ...old,
            notes: [...old.notes, tempNote],
          }
        },
      )

      return { previousNotes, tempNote }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
