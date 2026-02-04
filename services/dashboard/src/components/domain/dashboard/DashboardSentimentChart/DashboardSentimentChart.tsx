import { alpha, Stack, Typography } from '@mui/material'
import { theme } from '@zunou-react/services/Theme'
import React from 'react'

const SentimentChart: React.FC = () => {
  return (
    <Stack
      bgcolor="white"
      border={1}
      borderColor={alpha(theme.palette.primary.main, 0.1)}
      borderRadius={2}
      flexGrow={1}
      height="100%"
      p={2}
    >
      <Typography gutterBottom={true} variant="h6">
        Sentiments
      </Typography>
      <Stack display="flex" flexGrow={1} sx={{ background: '#eee' }} />
    </Stack>
  )
}

export default SentimentChart
