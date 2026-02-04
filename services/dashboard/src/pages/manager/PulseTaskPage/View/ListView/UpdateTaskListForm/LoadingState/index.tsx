import { Divider } from '@mui/material'
import { Stack } from '@mui/system'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'

export const LoadingState = () => {
  return (
    <Stack divider={<Divider />} spacing={2}>
      <Stack spacing={2}>
        <LoadingSkeleton height={40} width={400} />
        <Stack spacing={1}>
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
            sx={{ color: 'text.secondary' }}
          >
            <LoadingSkeleton height={40} width={560} />
          </Stack>
        </Stack>
      </Stack>
      <Stack alignSelf="end" direction="row" spacing={1}>
        <LoadingSkeleton height={32} width={96} />
        <LoadingSkeleton height={32} width={96} />
      </Stack>
    </Stack>
  )
}
