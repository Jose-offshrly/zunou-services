import { Stack } from '@mui/material'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'

export const DirectMessageSkeleton = () => {
  const renderMessageSkeleton = (orientation = 'left') => {
    const isLeft = orientation === 'left'

    const bubbleStyle = {
      borderRadius: '16px',
      ...(isLeft ? { borderTopLeftRadius: 0 } : { borderTopRightRadius: 0 }),
    }

    return (
      <Stack
        direction="row"
        justifyContent={isLeft ? 'flex-start' : 'flex-end'}
        width="100%"
      >
        <Stack
          alignItems="flex-start"
          direction="row"
          gap={2}
          sx={{
            flexDirection: isLeft ? 'row' : 'row-reverse',
            width: '80%',
          }}
        >
          <LoadingSkeleton height={50} width={50} />
          <Stack
            alignItems={isLeft ? 'flex-start' : 'flex-end'}
            flex={1}
            gap={1}
          >
            <LoadingSkeleton height={50} sx={bubbleStyle} width="60%" />
            <LoadingSkeleton height={60} sx={bubbleStyle} width="80%" />
          </Stack>
        </Stack>
      </Stack>
    )
  }

  return (
    <Stack
      justifyContent="end"
      sx={{
        gap: 3,
        height: '100%',
        width: '100%',
      }}
    >
      {renderMessageSkeleton('left')}
      {renderMessageSkeleton('right')}
    </Stack>
  )
}
