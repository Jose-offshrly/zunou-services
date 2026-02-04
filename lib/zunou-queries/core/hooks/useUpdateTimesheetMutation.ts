import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Timesheet, UpdateTimesheetInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateTimesheetResponse {
  timesheet: Timesheet
}

const updateTimesheetMutationDocument = graphql(/* GraphQL */ `
  mutation UpdateTimesheet($input: UpdateTimesheetInput!) {
    updateTimesheet(input: $input) {
      id
      checked_in_at
      checked_out_at
      user {
        name
      }
      total
    }
  }
`)

export const useUpdateTimesheetMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateTimesheetResponse,
  Error,
  UpdateTimesheetInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateTimesheetInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateTimesheetResponse>(
        updateTimesheetMutationDocument,
        {
          input,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['timesheets'],
      })
    },
  })
}
