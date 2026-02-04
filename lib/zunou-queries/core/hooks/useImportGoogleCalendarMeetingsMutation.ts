/// <reference types="vite/client" />

import { useMutation } from '@tanstack/react-query'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface ImportGoogleCalendarMeetingsResponse {
  importGoogleCalendarMeetings: {
    id: string
    meetingId: string
    meetingUrl: string
    status: string
    pulseId: string
    organizationId: string
  }[]
}

const IMPORT_GOOGLE_CALENDAR_MEETINGS_MUTATION = `
  mutation ImportGoogleCalendarMeetings($pulseId: String!, $organizationId: String!) {
    importGoogleCalendarMeetings(pulseId: $pulseId, organizationId: $organizationId) {
      id
      meetingId
      meetingUrl
      status
      pulseId
      organizationId
    }
  }
`

export const useImportGoogleCalendarMeetingsMutation = () => {
  const { getToken } = useAuthContext()
  const coreUrl = import.meta.env.VITE_CORE_GRAPHQL_URL || ''

  return useMutation({
    mutationFn: async (variables: {
      pulseId: string
      organizationId: string
    }) => {
      const token = await getToken()

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const client = gqlClient(coreUrl, token)
      const response =
        await client.request<ImportGoogleCalendarMeetingsResponse>(
          IMPORT_GOOGLE_CALENDAR_MEETINGS_MUTATION,
          variables,
        )
      return response.importGoogleCalendarMeetings
    },
  })
}
