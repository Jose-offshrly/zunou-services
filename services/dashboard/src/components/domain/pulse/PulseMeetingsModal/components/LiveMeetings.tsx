import { ExpandMore } from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from '@mui/material'

import { MeetingSessionsList } from '~/components/domain/dataSource/DataSourceSidebar/components/MeetingSessionsList'
import { AudioVisualizer } from '~/components/ui/AudioVisualizer'
import { useLiveMeetings } from '~/context/LiveMeetingsContext'

export default function LiveMeetings() {
  const { totalLive } = useLiveMeetings()

  return (
    <Accordion
      defaultExpanded={true}
      sx={{
        '&.Mui-expanded': {
          margin: '0 !important',
        },
        '&:before': {
          display: 'none',
        },
        borderRadius: '8px !important',
        boxShadow: 'none',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          '& .MuiAccordionSummary-content': {
            alignItems: 'center',
            gap: 1,
            margin: '8px 0 !important',
          },
          minHeight: 'auto !important',
          px: 0,
        }}
      >
        <Stack alignItems="center" direction="row" gap={1}>
          <Typography color="text.secondary" variant="body2">
            LIVE
          </Typography>
          {totalLive > 0 && <AudioVisualizer size="extraSmall" />}
        </Stack>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          height: '100%',
          p: 0,
        }}
      >
        <Stack gap={1.5} height="100%" py={1}>
          <MeetingSessionsList showEmptyPlaceholder={true} />
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
}
