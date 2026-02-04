import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Note } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DeleteNoteResponse {
  deleteNote: Note
}

interface NotesQueryData {
  notes: Note[]
}

const deleteNoteMutationDocument = graphql(/* GraphQL */ `
  mutation DeleteNote($noteId: ID!) {
    deleteNote(noteId: $noteId) {
      id
      title
      content
      labels {
        id
        name
        color
      }
      pinned
    }
  }
`)

export const useDeleteNotesMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DeleteNoteResponse,
  Error,
  { noteId: string }
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId }: { noteId: string }) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeleteNoteResponse>(
        deleteNoteMutationDocument,
        {
          noteId,
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
    onMutate: async ({ noteId }: { noteId: string }) => {
      await queryClient.cancelQueries({ queryKey: ['notes'] })

      const previousNotes = queryClient.getQueriesData({ queryKey: ['notes'] })

      queryClient.setQueriesData(
        { queryKey: ['notes'] },
        (old: NotesQueryData | undefined) => {
          if (!old?.notes) return old

          return {
            ...old,
            notes: old.notes.filter((note: Note) => note.id !== noteId),
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
