import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Note, UpdateNoteInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateNoteResponse {
  updateNote: Note
}

interface NotesQueryData {
  notes: Note[]
}

const UPDATE_NOTE_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateNote($input: UpdateNoteInput!) {
    updateNote(input: $input) {
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

export const useUpdateNotesMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateNoteResponse,
  Error,
  UpdateNoteInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateNoteInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateNoteResponse>(
        UPDATE_NOTE_MUTATION,
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
    onMutate: async (input: UpdateNoteInput) => {
      await queryClient.cancelQueries({ queryKey: ['notes'] })

      const previousNotes = queryClient.getQueriesData({ queryKey: ['notes'] })

      queryClient.setQueriesData(
        { queryKey: ['notes'] },
        (old: NotesQueryData | undefined) => {
          if (!old?.notes) return old

          return {
            ...old,
            notes: old.notes.map((note: Note) =>
              note.id === input.id
                ? {
                    ...note,
                    content: input.content ?? note.content,
                    labels: note.labels,
                    pinned: input.pinned ?? note.pinned,
                    title: input.title ?? note.title,
                    updatedAt: new Date().toISOString(),
                  }
                : note,
            ),
          }
        },
      )

      return { previousNotes }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
