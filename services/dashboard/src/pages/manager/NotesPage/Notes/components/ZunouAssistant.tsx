import {
  AutoModeOutlined,
  LiveHelpOutlined,
  NoteOutlined,
  PsychologyAltOutlined,
  SmartToyOutlined,
} from '@mui/icons-material'
import { Divider, Icon, Menu, MenuItem, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { useCreateCompletionMutation } from '@zunou-queries/core/hooks/useCreateCompletionMutation'
import zunouChatIcon from '@zunou-react/assets/images/zunou-chat-icon.svg'
import { Image } from '@zunou-react/components/utility'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { IconButton } from 'zunou-react/components/form'
import { pathFor } from 'zunou-react/services/Routes'
import { theme } from 'zunou-react/services/Theme'

import { useOrganization } from '~/hooks/useOrganization'
import { CLOSE_WELCOME_MESSAGE_KEY } from '~/pages/manager/PulseDetailPage/hooks'
import { Routes } from '~/services/Routes'
import { usePulseStore } from '~/store/usePulseStore'
import { getPrefixSegment } from '~/utils/urlUtils'
import { withStopPropagation } from '~/utils/withStopPropagation'

interface NoteAction {
  name: string
  message: (title: string) => string
  icon: React.ElementType
  isActive: boolean
  onClick?: () => void
}

export const ZunouAssistant = ({ title }: { title: string }) => {
  const { t } = useTranslation(['common', 'tasks'])
  const navigate = useNavigate()

  const { activeThreadId } = usePulseStore()
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const { pathname: currentPath } = useLocation()

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const { mutateAsync: createCompletion } = useCreateCompletionMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setAnchorEl(e.currentTarget)
  }

  const handleClose = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setAnchorEl(null)
  }

  const navigateToPulseChat = () => {
    navigate(
      pathFor({
        pathname: `/${getPrefixSegment(currentPath)}/${Routes.PulseDetail}`,
        query: {
          organizationId,
          pulseId,
        },
      }),
    )
  }

  const noteActions: NoteAction[] = [
    {
      icon: PsychologyAltOutlined,
      isActive: true,
      message: (title) => {
        return `Explain this note: ${title}`
      },
      name: 'Explain',
    },
    {
      icon: NoteOutlined,
      isActive: true,
      message: (title) => {
        return `Summarize this note: ${title}`
      },
      name: 'Summarize',
    },
    {
      icon: LiveHelpOutlined,
      isActive: true,
      message: (title) => {
        return `I need help with this note: ${title}`
      },
      name: 'Need Help',
    },
    {
      icon: AutoModeOutlined,
      isActive: false,
      message: (title) => {
        return `Help me organize this note: ${title}`
      },
      name: 'Organize',
    },
  ]

  const handleNoteAction = async (message: string) => {
    if (!activeThreadId) return

    await createCompletion({
      message,
      organizationId,
      threadId: activeThreadId,
    })

    // Close welcome message if open
    sessionStorage.setItem(CLOSE_WELCOME_MESSAGE_KEY, 'true')

    navigateToPulseChat()
  }

  const handleAssistant = withStopPropagation(() =>
    console.log('Assistant clicked'),
  )

  const options = noteActions.map(({ name, icon, isActive, message }) => ({
    icon,
    isActive,
    name,
    onClick: withStopPropagation(() => handleNoteAction(message(title))),
  }))

  return (
    <>
      <IconButton onClick={handleClick} size="small">
        <Image
          alt="Logo"
          height={24}
          src={zunouChatIcon}
          style={{ display: 'block' }}
        />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        onClose={handleClose}
        open={open}
        slotProps={{
          paper: {
            style: {
              border: `1px solid ${theme.palette.grey['200']}`,
              boxShadow: 'none',
              marginTop: 4,
              minWidth: 160,
            },
          },
        }}
      >
        <MenuItem disabled={true} onClick={handleAssistant}>
          <Stack alignItems="center" direction="row" spacing={1}>
            <Icon component={SmartToyOutlined} fontSize="small" />
            <Typography fontSize="small">{t('assistant')}</Typography>
          </Stack>
        </MenuItem>
        <Divider />
        {options.map(({ isActive = false, icon, name, onClick }, index) => {
          return (
            <MenuItem disabled={!isActive} key={index} onClick={onClick}>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Icon component={icon} fontSize="small" />
                <Typography fontSize="small">{name}</Typography>
              </Stack>
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}
