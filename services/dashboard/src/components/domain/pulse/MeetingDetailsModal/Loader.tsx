import { CircularProgress, Stack } from '@mui/material'

export default function Loader() {
  return (
    <Stack
      alignItems="center"
      gap={2}
      height="100%"
      justifyContent="center"
      minHeight={300}
      px={1}
      py={2}
      width="100%"
    >
      <CircularProgress size={24} />
    </Stack>
  )
}
