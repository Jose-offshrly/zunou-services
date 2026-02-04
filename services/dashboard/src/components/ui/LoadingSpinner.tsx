import CircularProgress from '@mui/material/CircularProgress'
import { Stack } from '@mui/system'
import { theme } from '@zunou-react/services/Theme'

interface LoadingSpinnerProps {
  size?: number
  padding?: number
  color?: string
}

export const LoadingSpinner = ({
  size = 24,
  padding = 2,
  color = theme.palette.primary.main,
}: LoadingSpinnerProps) => (
  <Stack alignItems="center" justifyContent="center" padding={padding}>
    <CircularProgress size={size} sx={{ color }} />
  </Stack>
)
