import { AutoAwesomeOutlined } from '@mui/icons-material'
import { alpha, Stack, Typography } from '@mui/material'
import { SwitchInput } from '@zunou-react/components/form'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { Control } from 'react-hook-form'

import { Detail, Row } from './Layout'

interface PulseCompanionSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  isDisabled: boolean
  isLive?: boolean
}

export function PulseCompanionSection({
  control,
  isDisabled,
  isLive = false,
}: PulseCompanionSectionProps) {
  return (
    <Row>
      <Detail>
        <AutoAwesomeOutlined sx={{ fontSize: 15 }} />
        <Stack>
          <Typography fontWeight={500} variant="body2">
            Pulse Companion
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Bot joins and takes notes automatically
          </Typography>
        </Stack>
      </Detail>
      {isLive ? (
        <Stack
          borderRadius={9999}
          px={2}
          py={0.5}
          sx={(theme) => ({
            bgcolor: alpha(theme.palette.common.lime, 0.1),
          })}
        >
          <Typography color="common.lime" fontWeight={500} variant="body2">
            Live
          </Typography>
        </Stack>
      ) : (
        <SwitchInput
          control={control}
          disabled={isDisabled}
          id="invitePulse"
          name="invitePulse"
        />
      )}
    </Row>
  )
}
