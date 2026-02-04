import {
  InvalidateQueryFilters,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { AcknowledgeMisalignmentAlertInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface AcknowledgeMisalignmentAlertResponse {
  id: string
}

const acknowledgeMisalignmentAlertMutationDocument = graphql(/* GraphQL */ `
  mutation AcknowledgeMisalignmentAlert(
    $input: AcknowledgeMisalignmentAlertInput!
  ) {
    acknowledgeMisalignmentAlert(input: $input) {
      id
    }
  }
`)

export const useAcknowledgeMisalignmentAlertMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  AcknowledgeMisalignmentAlertResponse,
  Error,
  AcknowledgeMisalignmentAlertInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AcknowledgeMisalignmentAlertInput) => {
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<AcknowledgeMisalignmentAlertResponse>(
        acknowledgeMisalignmentAlertMutationDocument,
        { input },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries([
        'misalignmentAlerts',
      ] as InvalidateQueryFilters)
      // TODO: Convert this into a Toast Message (pre: install react-hot-toast)
      alert('Alert acknowledged.')
    },
  })
}
