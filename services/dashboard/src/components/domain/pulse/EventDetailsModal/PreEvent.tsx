import { Stack, Tab, Tabs } from '@mui/material'
import React, { useState } from 'react'

import AgendaTab from '../MeetingDetailsModal/AgendaTab'
import DetailsTab from '../MeetingDetailsModal/DetailsTab'
import TalkingPointsTab from '../MeetingDetailsModal/TalkingPointsTab'

interface Props {
  eventId: string | null
}

enum MeetingTab {
  Details = 'details',
  Agenda = 'agenda',
  TalkingPoints = 'talking_points',
}

export default function PreEvent({ eventId }: Props) {
  const tabs = [
    { isDisabled: false, label: 'Details', value: MeetingTab.Details },
    { isDisabled: false, label: 'Agenda', value: MeetingTab.Agenda },
    {
      isDisabled: false,
      label: 'Talking Points',
      value: MeetingTab.TalkingPoints,
    },
  ]

  const [selectedTab, setSelectedTab] = useState<MeetingTab>(MeetingTab.Details)

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: MeetingTab,
  ) => {
    setSelectedTab(newValue)
  }

  return (
    <Stack>
      <Stack
        borderBottom={1}
        sx={{
          borderColor: 'divider',
          mb: 1,
        }}
      >
        <Tabs onChange={handleTabChange} value={selectedTab}>
          {tabs.map((tab) => (
            <Tab
              disabled={tab.isDisabled}
              key={tab.value}
              label={tab.label}
              value={tab.value}
            />
          ))}
        </Tabs>
      </Stack>

      {/* Tab content with overflow */}
      <Stack sx={{ flex: 1, overflowY: 'auto', px: 1, py: 2 }}>
        {selectedTab === MeetingTab.Details && eventId && (
          <DetailsTab eventId={eventId} />
        )}

        {selectedTab === MeetingTab.Agenda && eventId && (
          <AgendaTab eventId={eventId} />
        )}

        {selectedTab === MeetingTab.TalkingPoints && eventId && (
          <TalkingPointsTab eventId={eventId} />
        )}
      </Stack>
    </Stack>
  )
}
