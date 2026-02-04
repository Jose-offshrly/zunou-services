import { Stack, Tab, Tabs } from '@mui/material'
import React, { useState } from 'react'

import { CustomModal } from '~/components/ui/CustomModal'

import AgendaTab from './AgendaTab'
import DetailsTab from './DetailsTab'
import TalkingPointsTab from './TalkingPointsTab'

interface Props {
  isOpen: boolean
  onClose: () => void
  eventId: string
}

enum MeetingTab {
  Details = 'details',
  Agenda = 'agenda',
  TalkingPoints = 'talking_points',
}

export default function MeetingDetailsModal({
  isOpen,
  onClose,
  eventId,
}: Props) {
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
    <CustomModal isOpen={isOpen} onClose={onClose} title="Meeting Details">
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
    </CustomModal>
  )
}
