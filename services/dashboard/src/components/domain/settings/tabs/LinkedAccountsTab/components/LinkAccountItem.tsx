import { Box, Stack, Typography } from '@mui/material'
import { LoadingButton } from '@zunou-react/components/form'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useTranslation } from 'react-i18next'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'

interface LinkAccountItemProps {
  icon: string
  name: string
  description: string
  isLoading?: boolean
  isSubmitting?: boolean
  onClick?: () => void
  isLinked?: boolean
  isDisabled?: boolean
  error?: string | null
}

const LinkAccountItem = ({
  icon,
  name,
  description,
  isLoading = false,
  isSubmitting = false,
  onClick,
  isLinked = false,
  isDisabled = false,
}: LinkAccountItemProps) => {
  const { t } = useTranslation()
  const { user } = useAuthContext()

  return (
    <Stack
      alignItems="center"
      direction="row"
      gap={4}
      justifyContent="space-between"
      width="100%"
    >
      <Stack alignItems="center" direction="row" flex={1} gap={2}>
        <Box height={30} width={30}>
          <img height="100%" src={icon} width="100%" />
        </Box>
        <Stack flex={1}>
          <Typography fontWeight={500}>{name}</Typography>
          <Typography color="text.secondary" variant="body2">
            {description}
          </Typography>
        </Stack>
      </Stack>
      <Stack alignItems="center" gap={1} width="25%">
        {isLoading ? (
          <LoadingSkeleton height={32} width="100%" />
        ) : (
          <LoadingButton
            disabled={isDisabled}
            loading={isSubmitting}
            onClick={onClick}
            startIcon={
              !isSubmitting && isLinked ? (
                <Avatar
                  placeholder={user?.name}
                  size="small"
                  src={user?.gravatar || user?.picture || undefined}
                  variant="circular"
                />
              ) : undefined
            }
            sx={{
              width: '100%',
            }}
            variant={isDisabled ? 'contained' : isLinked ? 'text' : 'outlined'}
          >
            {isLinked ? t('unlink_account') : t('link')}
          </LoadingButton>
        )}
      </Stack>
    </Stack>
  )
}

export default LinkAccountItem
