import { Stack } from '@mui/system'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'

export const LoadingState = () => (
  <Stack spacing={1}>
    <LoadingSkeleton height={24} />
    <LoadingSkeleton height={24} />
    <LoadingSkeleton height={24} />
    <LoadingSkeleton height={24} />
  </Stack>
)
