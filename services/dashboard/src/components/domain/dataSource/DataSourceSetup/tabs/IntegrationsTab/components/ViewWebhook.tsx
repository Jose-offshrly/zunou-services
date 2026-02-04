import { ChevronLeft } from '@mui/icons-material'
import { Divider, List, ListItem, TextField, Typography } from '@mui/material'
import { lighten, Stack } from '@mui/system'
import { useGetFirefliesWebhookUrl } from '@zunou-queries/core/hooks/useGetFirefliesWebhookUrl'
import { useGetIntegration } from '@zunou-queries/core/hooks/useGetIntegration'
import { Button, IconButton } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'

interface ViewWebhookProps {
  handleBack: () => void
  icon: string
  title: string
  description: string
}

const FIREFLIES_HOW_TO_USE = [
  'Go to Fireflies API/Webhook settings.',
  'Enter your webhook URL (https://yourserver.com/fireflies-webhook).',
]

export const ViewWebhook = ({
  handleBack,
  icon,
  title,
  description,
}: ViewWebhookProps) => {
  const { pulseId } = useParams()
  const { user } = useAuthContext()

  const [isCopying, setIsCopying] = useState(false)

  const handleCopy = () => {
    if (isCopying) return // Prevent spamming

    const webhookUrl = getFirefliesWebhookUrl?.fireFliesWebhookUrl
    if (!webhookUrl) {
      toast.error('No webhook URL available to copy')
      return
    }

    navigator.clipboard.writeText(webhookUrl)
    toast.success('Webhook URL copied!')

    setIsCopying(true)
    setTimeout(() => setIsCopying(false), 2000) // Cooldown of 2 seconds
  }

  const { data: firefliesIntegrationData } = useGetIntegration({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      pulseId: pulseId,
      type: 'fireflies',
      userId: user?.id,
    },
  })

  const firefliesIntegration = firefliesIntegrationData?.integration

  const {
    data: getFirefliesWebhookUrl,
    isFetching: isFetchingGetFirefliesWebhookUrl,
  } = useGetFirefliesWebhookUrl({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: Boolean(firefliesIntegration),
    variables: {
      pulseId: pulseId,
    },
  })

  return (
    <Stack alignItems="center" justifyContent="center" spacing={2} width="100%">
      <Stack alignItems="start" spacing={2} width="100%">
        <Stack alignItems="center" direction="row" spacing={1}>
          <IconButton
            onClick={handleBack}
            sx={{
              '&:hover': { backgroundColor: 'transparent' },
              p: 0,
            }}
          >
            <ChevronLeft fontSize="small" />
            <Typography fontSize={14}>Back</Typography>
          </IconButton>
        </Stack>
      </Stack>

      <Stack
        alignItems="center"
        border={1}
        borderColor={lighten(theme.palette.primary.main, 0.9)}
        borderRadius={1}
        justifyContent="center"
        p={3}
        width="100%"
      >
        <Stack alignItems="center" spacing={2} width="100%">
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="center"
            spacing={1}
          >
            <img alt="integration-icon" height={40} src={icon} width={40} />
            <Typography fontSize={18} fontWeight={500}>
              {title}
            </Typography>
          </Stack>

          {description && (
            <Typography
              color="text.secondary"
              maxWidth={600}
              variant="subtitle1"
            >
              {description}
            </Typography>
          )}

          <Divider sx={{ width: '100%' }} />
          {isFetchingGetFirefliesWebhookUrl ? (
            <LoadingSpinner />
          ) : (
            <Stack gap={3} width="100%">
              <Stack gap={1}>
                <Typography fontWeight={600} variant="body1">
                  Webhook URL
                </Typography>
                <Stack
                  alignItems="center"
                  direction="row"
                  spacing={3}
                  width="100%"
                >
                  <Stack
                    border={1}
                    borderColor="divider"
                    borderRadius={1}
                    p={0}
                    width="100%"
                  >
                    <TextField
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            border: 'none', // Removes the border
                          },
                        },
                        m: 0,
                        p: 0,
                      }}
                      value={getFirefliesWebhookUrl?.fireFliesWebhookUrl}
                    />
                  </Stack>
                  <Button
                    disabled={isCopying}
                    onClick={handleCopy}
                    size="large"
                    variant="contained"
                  >
                    {isCopying ? 'Copied!' : 'Copy'}
                  </Button>
                </Stack>
              </Stack>

              <Stack
                bgcolor={theme.palette.background.default}
                border={1}
                borderColor="divider"
                borderRadius={1}
                p={2}
                width="100%"
              >
                <Typography fontWeight={600} variant="body1">
                  How to use
                </Typography>
                <List
                  sx={{
                    '& .MuiListItem-root': {
                      paddingBottom: '2px',
                      paddingTop: '2px',
                    },
                    listStylePosition: 'inside',
                    listStyleType: 'disc',
                  }}
                >
                  {FIREFLIES_HOW_TO_USE.map((item, index) => (
                    <ListItem key={index} sx={{ display: 'list-item' }}>
                      {item}
                    </ListItem>
                  ))}
                </List>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Stack>
  )
}
