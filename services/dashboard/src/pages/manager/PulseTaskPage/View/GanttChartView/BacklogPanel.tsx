import { Close } from '@mui/icons-material'
import { Box, IconButton, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useState } from 'react'

import OverdueContainer from './components/OverdueContainer'
import UnscheduledContainer from './components/UnscheduledContainer'

interface BacklogPanelProps {
  onClose: () => void
}

export default function BacklogPanel({ onClose }: BacklogPanelProps) {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Stack
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 5,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxWidth: 400,
        overflow: 'hidden',
        position: 'absolute',
        right: 0,
        top: 0,
        width: '100%',
        zIndex: 50,
      }}
    >
      {/* Header */}
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          p: 1.5,
        }}
      >
        <Typography fontWeight={600} variant="h6">
          Tasks
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </Stack>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs
          aria-label="backlog tabs"
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              fontSize: '0.875rem',
              minHeight: 40,
              textTransform: 'none',
            },
            minHeight: 40,
          }}
          value={tabValue}
        >
          <Tab label="Unscheduled" />
          <Tab label="Overdue" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          py: 2,
        }}
      >
        {/* Unscheduled Tab */}
        {tabValue === 0 && <UnscheduledContainer />}

        {/* Overdue Tab */}
        {tabValue === 1 && <OverdueContainer />}
      </Box>
    </Stack>
  )
}
