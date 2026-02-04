import { Inbox } from '@mui/icons-material'
import { Stack } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { theme } from '@zunou-react/services/Theme'

export const TaskIcon = () => (
  <Stack
    alignItems="center"
    bgcolor={alpha(theme.palette.primary.main, 0.03)}
    borderRadius={1}
    p={1}
  >
    <Inbox
      fontSize="small"
      sx={{
        color: 'primary.main',
      }}
    />
  </Stack>
)
