import { Typography } from '@mui/material'

export const NoDataText = ({ text = 'No data.' }: { text?: string }) => (
  <Typography color="text.secondary" variant="body2">
    {text}
  </Typography>
)
