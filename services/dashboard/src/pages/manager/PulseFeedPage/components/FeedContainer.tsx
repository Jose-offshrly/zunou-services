import { Divider, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface FeedContainerProps {
  children: ReactNode
}

const FeedContainer = ({ children }: FeedContainerProps) => {
  const { t } = useTranslation(['feed'])
  return (
    <Stack
      alignItems="center"
      height="100%"
      justifyContent="start"
      overflow="auto"
      p={4}
      width="100%"
    >
      <Stack
        bgcolor="background.paper"
        border={1}
        borderColor="divider"
        borderRadius={4}
        divider={<Divider sx={{ borderColor: 'divider' }} />}
        sx={{
          maxWidth: 1200,
          width: {
            lg: '65%',
            md: '95%',
          },
        }}
        width="100%"
      >
        {/* Header */}
        <Stack px={3} py={2}>
          <Typography fontWeight="bold" variant="body1">
            {t('your_feed')}
          </Typography>
        </Stack>
        {children}
      </Stack>
    </Stack>
  )
}

export default FeedContainer
