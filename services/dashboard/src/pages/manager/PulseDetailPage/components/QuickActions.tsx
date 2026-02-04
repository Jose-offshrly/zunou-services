import {
  Circle,
  EmojiObjectsOutlined,
  FactCheckOutlined,
  HelpOutlineOutlined,
} from '@mui/icons-material'
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { useCreateCompletionMutation } from '@zunou-queries/core/hooks/useCreateCompletionMutation'
import { Button } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import CollabButton, {
  CollabButtonVariant,
} from '~/components/domain/pulse/PulseNavbar/NavbarTop/components/CollabButton'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'
import { ShowPulseWelcomeState, usePulseStore } from '~/store/usePulseStore'

const QuickActions = ({ onReturn }: { onReturn: () => void }) => {
  const { t } = useTranslation('pulse')
  const navigate = useNavigate()
  const { userRole } = useAuthContext()
  const { organizationId } = useOrganization()
  const { pulseId } = useParams<{ pulseId: string }>()
  const { pulseWelcomeState, activeThreadId } = usePulseStore()

  const welcomeData = useMemo(() => {
    return pulseWelcomeState.find((pulse) => pulse.pulseId === pulseId) ?? null
  }, [pulseWelcomeState])

  const isFirstTimeInPulse =
    welcomeData?.state === ShowPulseWelcomeState.FirstTime

  const rolePrefix = useMemo(() => userRole?.toLowerCase() ?? '', [userRole])

  const { mutateAsync: createCompletion } = useCreateCompletionMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const taskHandler = () => {
    if (!organizationId || !pulseId) {
      toast.error('Missing organization or pulse id.')
      return
    }

    navigate(
      `/${rolePrefix}/${pathFor({
        pathname: Routes.PulseTasks,
        query: { organizationId, pulseId },
      })}`,
    )
  }

  const missedHandler = () => {
    if (!activeThreadId) {
      toast.error('Missing active thread Id.')
      return
    }

    onReturn()

    createCompletion(
      {
        message: t('pulse_summary_request'),
        organizationId,
        threadId: activeThreadId,
      },
      { onError: () => toast.error('Something went wrong, message not sent.') },
    )
  }

  const planHandler = () => {
    if (!activeThreadId) {
      toast.error('Missing active thread Id.')
      return
    }

    onReturn()

    createCompletion(
      {
        message: t('pulse_daily_plan_request'),
        organizationId,
        threadId: activeThreadId,
      },
      { onError: () => toast.error('Something went wrong, message not sent.') },
    )
  }

  const overviewHandler = () => {
    if (!activeThreadId) {
      toast.error('Missing active thread Id.')
      return
    }

    onReturn()

    createCompletion(
      {
        message: t('pulse_quick_overview_request'),
        organizationId,
        threadId: activeThreadId,
      },
      { onError: () => toast.error('Something went wrong, message not sent.') },
    )
  }

  if (!activeThreadId) return

  return (
    <Stack gap={2}>
      {isFirstTimeInPulse ? (
        <Stack borderBottom={1} borderColor="divider" pb={2} spacing={2}>
          <Typography fontWeight="600" variant="body2">
            {t('pulse_capabilities_prompt').toUpperCase()}
          </Typography>

          <List disablePadding={true}>
            {[
              'Get smart summaries of meetings, chats, and tasks',
              'Stay on top of what matters with daily nudges',
              'Collaborate easily with your team through updates and quick actions',
            ].map((text, index) => (
              <ListItem
                disableGutters={true}
                key={index}
                sx={{ minHeight: 'auto', my: 0, py: 0 }}
              >
                <ListItemIcon sx={{ minWidth: 20, mt: '2px' }}>
                  <Circle sx={{ fontSize: 6 }} />
                </ListItemIcon>
                <ListItemText
                  primary={text}
                  primaryTypographyProps={{
                    sx: { lineHeight: 1.4 },
                    variant: 'body1',
                  }}
                />
              </ListItem>
            ))}
          </List>

          <Typography fontWeight="600" variant="body2">
            {t('pulse_ready_prompt').toUpperCase()}
          </Typography>

          <List disablePadding={true}>
            {[t('pulse_create_first_task'), t('pulse_chat_explore_prompt')].map(
              (text, index) => (
                <ListItem
                  disableGutters={true}
                  key={index}
                  sx={{ minHeight: 'auto', my: 0, py: 0 }}
                >
                  <ListItemIcon sx={{ minWidth: 20, mt: '2px' }}>
                    <Circle sx={{ fontSize: 6 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={text}
                    primaryTypographyProps={{
                      sx: { lineHeight: 1.4 },
                      variant: 'body1',
                    }}
                  />
                </ListItem>
              ),
            )}
          </List>

          <Typography variant="body1">{t('pulse_next_step_prompt')}</Typography>
        </Stack>
      ) : (
        <Stack borderBottom={1} borderColor="divider" pb={2}>
          <Typography variant="body1">
            {t('pulse_quickstart_prompt')}
          </Typography>
        </Stack>
      )}

      <Stack alignItems="center" direction="row" flexWrap="wrap" gap={2}>
        {!isFirstTimeInPulse && (
          <Button
            onClick={taskHandler}
            startIcon={<FactCheckOutlined />}
            variant="contained"
          >
            {t('open_task_board')}
          </Button>
        )}

        <CollabButton variant={CollabButtonVariant.PulseChat} />

        {!isFirstTimeInPulse && (
          <Button
            onClick={missedHandler}
            startIcon={<HelpOutlineOutlined />}
            sx={{
              color: 'text.primary',
            }}
            variant="text"
          >
            {t('missed_updates_prompt')}
          </Button>
        )}

        {!isFirstTimeInPulse && (
          <Button
            onClick={planHandler}
            startIcon={<EmojiObjectsOutlined />}
            sx={{
              color: 'text.primary',
            }}
            variant="text"
          >
            {t('todays_plan_prompt')}
          </Button>
        )}

        {isFirstTimeInPulse && (
          <Button
            onClick={overviewHandler}
            startIcon={<EmojiObjectsOutlined />}
            sx={{
              color: 'text.primary',
            }}
            variant="text"
          >
            {t('quick_overview')}
          </Button>
        )}
      </Stack>
    </Stack>
  )
}

export default QuickActions
