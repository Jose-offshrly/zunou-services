import { Box, Stack, Tab, Tabs } from '@mui/material'
import React, { useState } from 'react'

import PastMeetings from './PastMeetings'
import UpcomingMeetings from './UpcomingMeetings'

export default function ManageMeetings() {
  const [currentTab, setCurrentTab] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  return (
    <Stack gap={0.5} height="100%">
      <Tabs
        onChange={handleTabChange}
        sx={{ flexShrink: 0 }}
        value={currentTab}
      >
        <Tab label="UPCOMING" />
        <Tab label="PAST" />
      </Tabs>

      <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1, py: 1 }}>
        {currentTab === 0 && <UpcomingMeetings />}
        {currentTab === 1 && <PastMeetings />}
      </Box>
    </Stack>
  )
}
