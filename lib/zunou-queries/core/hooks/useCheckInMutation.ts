import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { Timesheet } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CheckInResponse {
  checkIn: Timesheet
}

const CHECK_IN_MUTATION = graphql(/* GraphQL */ `
  mutation CheckIn {
    checkIn {
      id
      userId
      checked_in_at
      checked_out_at
      total
    }
  }
`)

export const useCheckInMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<CheckInResponse, Error, void> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CheckInResponse>(
        CHECK_IN_MUTATION,
      )
    },
    onSuccess: ({ checkIn }) => {
      queryClient.invalidateQueries({
        queryKey: ['userActiveTimesheet', checkIn.userId],
      })
      queryClient.invalidateQueries({
        queryKey: ['timesheets'],
      })
    },
  })
}
