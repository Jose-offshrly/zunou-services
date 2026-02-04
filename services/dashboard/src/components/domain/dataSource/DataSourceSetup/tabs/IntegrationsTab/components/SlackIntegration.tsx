import { CheckCircleOutlined, ChevronLeft } from '@mui/icons-material'
import { Divider, lighten, Stack, Typography } from '@mui/material'
import { Button } from '@zunou-react/components/form'
import { IconButton } from '@zunou-react/components/form/IconButton'
import { theme } from '@zunou-react/services/Theme'
import { useState } from 'react'

interface SlackIntegrationProps {
  handleBack: () => void
  icon: string
}

export const SlackIntegration = ({
  handleBack,
  icon,
}: SlackIntegrationProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleConnect = () => {
    setIsSubmitted(true)
  }

  return (
    <Stack alignItems="center" justifyContent="center" spacing={3} width="100%">
      {/* Header */}
      <Stack alignItems="start" spacing={1} width="100%">
        <Typography fontWeight="bold" variant="h6">
          Add Slack Integration
        </Typography>
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
        {isSubmitted ? (
          <Stack alignItems="center" spacing={3}>
            <Stack
              alignItems="center"
              direction="row"
              justifyContent="center"
              spacing={1}
            >
              <img alt="Slack" height={40} src={icon} width={40} />
              <Typography fontSize={18} fontWeight={500}>
                Slack
              </Typography>
            </Stack>

            <Divider sx={{ width: '100%' }} />
            <Stack alignItems="center" justifyContent="center" spacing={1}>
              <CheckCircleOutlined
                sx={{ color: 'primary.main', fontSize: 40 }}
              />
              <Typography fontSize={20} fontWeight={500}>
                Successfully connected to Slack!
              </Typography>
            </Stack>
          </Stack>
        ) : (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={3}
            width="100%"
          >
            <Stack
              alignItems="center"
              direction="row"
              justifyContent="center"
              spacing={1}
            >
              <img alt="Slack" height={40} src={icon} width={40} />
              <Typography fontSize={18} fontWeight={500}>
                Slack
              </Typography>
            </Stack>

            <Divider sx={{ width: '100%' }} />

            <Button
              color="primary"
              onClick={handleConnect}
              size="large"
              variant="contained"
            >
              Connect to Slack
            </Button>
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}
