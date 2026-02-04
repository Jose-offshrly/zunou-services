import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DeleteNoteAttachmentResponse {
  deleteNoteFileAttachement: boolean
}

const deleteNoteAttachmentMutationDocument = graphql(/* GraphQL */ `
  mutation DeleteNoteAttachment($fileId: ID!) {
    deleteNoteFileAttachement(fileId: $fileId)
  }
`)

export const useDeleteNoteAttachmentMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DeleteNoteAttachmentResponse,
  Error,
  { fileId: string }
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ fileId }: { fileId: string }) => {
      const token = await getToken()
      return gqlClient(coreUrl, token).request<DeleteNoteAttachmentResponse>(
        deleteNoteAttachmentMutationDocument,
        {
          fileId,
        },
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
