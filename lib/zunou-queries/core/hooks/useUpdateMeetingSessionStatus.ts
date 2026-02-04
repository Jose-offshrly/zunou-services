/// <reference types="vite/client" />

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MeetingSessionStatus } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

const UPDATE_MEETING_SESSION_STATUS = `
  mutation UpdateMeetingSession($input: UpdateMeetingSessionInput!) {
    updateMeetingSession(input: $input) {
      id
      status
    }
  }
`

interface UpdateMeetingSessionStatusResponse {
  updateMeetingSession: {
    id: string
    status: string
  }
}

export const useUpdateMeetingSessionStatus = () => {
  const { getToken } = useAuthContext()
  const coreUrl = import.meta.env.VITE_CORE_GRAPHQL_URL || ''
  const queryClient = useQueryClient()

  return useMutation<
    UpdateMeetingSessionStatusResponse,
    Error,
    { id: string; status: MeetingSessionStatus }
  >({
    mutationFn: async ({ id, status }) => {
      const token = await getToken()

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const client = gqlClient(coreUrl, token)
      const response = await client.request<UpdateMeetingSessionStatusResponse>(
        UPDATE_MEETING_SESSION_STATUS,
        {
          input: {
            meetingSessionId: id,
            status,
          },
        },
      )
      return response
    },
    onSuccess: () => {
      // Invalidate the meeting sessions query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ['meetingSessions'] })
    },
  })
}
