import { Avatar, Checkbox, FormControlLabel, Typography } from '@mui/material'
import { alpha, Box, Stack } from '@mui/system'
import { UserPresence } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'

import { getFirstLetter } from '~/utils/textUtils'

interface ParticipantItemProps {
  checked: boolean
  email: string
  gravatar?: string | null
  name: string
  onToggle: () => void
  presence?: UserPresence | null
  disabled?: boolean
}

const getStatusColor = (presence?: UserPresence | null) => {
  switch (presence) {
    case UserPresence.Active:
      return theme.palette.common.green
    case UserPresence.Busy:
      return theme.palette.error.main
    case UserPresence.Hiatus:
      return theme.palette.warning.main
    default:
      return theme.palette.grey[400]
  }
}

export const ParticipantItem = ({
  checked,
  email,
  gravatar,
  name,
  onToggle,
  presence,
  disabled = false,
}: ParticipantItemProps) => {
  return (
    <FormControlLabel
      checked={checked}
      control={<Checkbox size="small" />}
      disabled={disabled}
      label={
        <Stack alignItems="center" direction="row" px={1} spacing={1}>
          <Avatar
            color="primary.main"
            src={gravatar || undefined}
            variant="rounded"
          >
            {!gravatar && getFirstLetter(name)}
          </Avatar>

          <Typography>{name}</Typography>
          <Box
            sx={{
              bgcolor: getStatusColor(presence),
              border: 1,
              borderColor: alpha(getStatusColor(presence), 0.5),
              borderRadius: '50%',
              height: 9,
              width: 9,
            }}
          />
          <Typography>{email}</Typography>
        </Stack>
      }
      onChange={onToggle}
    />
  )
}
