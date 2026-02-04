import { Stack } from '@mui/system'
import { useGetMeetingsQuery } from '@zunou-queries/core/hooks/useGetMeetingsQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useParams } from 'react-router-dom'

import { MeetingListIdentifier } from './ManageMeetings'
import { MeetingsList } from './MeetingsList'

const AddedMeetings = () => {
  const { user } = useAuthContext()
  const { pulseId } = useParams<{ pulseId: string }>()

  const { data: meetingsData, isLoading: isLoadingMeeting } =
    useGetMeetingsQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        added: true,
        pulseId,
        userId: user?.id,
      },
    })

  return (
    <Stack gap={2} height="100%" width="100%">
      <MeetingsList
        isLoading={isLoadingMeeting}
        meetings={meetingsData?.meetings ?? []}
        type={MeetingListIdentifier.ADDED}
      />
    </Stack>
  )
}

export default AddedMeetings
