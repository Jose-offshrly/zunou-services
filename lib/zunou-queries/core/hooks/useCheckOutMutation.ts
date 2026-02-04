import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { Timesheet } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CheckOutResponse {
  checkOut: Timesheet
}

const CHECK_OUT_MUTATION = graphql(/* GraphQL */ `
  mutation CheckOut {
    checkOut {
      id
      userId
      checked_in_at
      checked_out_at
      total
    }
  }
`)

export const useCheckOutMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<CheckOutResponse, Error, void> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CheckOutResponse>(
        CHECK_OUT_MUTATION,
      )
    },
    onSuccess: ({ checkOut }) => {
      queryClient.invalidateQueries({
        queryKey: ['userActiveTimesheet', checkOut.userId],
      })
      queryClient.invalidateQueries({
        queryKey: ['timesheets'],
      })
    },
  })
}
