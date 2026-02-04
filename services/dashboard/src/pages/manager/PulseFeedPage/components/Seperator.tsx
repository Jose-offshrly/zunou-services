import { Divider, Typography } from '@mui/material'
import { Stack } from '@mui/system'

interface SeperatorProps {
  text: string
}

const Seperator = ({ text }: SeperatorProps) => {
  return (
    <Stack
      alignItems="center"
      direction="row"
      justifyContent="center"
      px={3}
      py={2}
      spacing={2}
      width="100%"
    >
      <Divider sx={{ borderColor: 'error.light', flex: 1 }} />
      <Typography
        sx={{
          color: 'error.light',
          fontStyle: 'italic',
          whiteSpace: 'nowrap',
        }}
        variant="body2"
      >
        {text}
      </Typography>
      <Divider sx={{ borderColor: 'error.light', flex: 1 }} />
    </Stack>
  )
}

export default Seperator
