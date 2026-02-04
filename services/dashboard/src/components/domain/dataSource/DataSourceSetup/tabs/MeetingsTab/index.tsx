import { useState } from 'react'

import AddMeetingForm from './components/AddMeetingForm'
import { ManageMeetings } from './components/ManageMeetings'

export const MeetingsTab = () => {
  const [addMeetingMode, setAddMeetingMode] = useState(false)

  return (
    <>
      {addMeetingMode ? (
        <AddMeetingForm setAddMeetingMode={setAddMeetingMode} />
      ) : (
        <ManageMeetings setAddMeetingMode={setAddMeetingMode} />
      )}
    </>
  )
}
