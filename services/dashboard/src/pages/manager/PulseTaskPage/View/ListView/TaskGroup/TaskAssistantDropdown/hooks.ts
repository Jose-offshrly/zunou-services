import {
  AutoModeOutlined,
  LiveHelpOutlined,
  NoteOutlined,
  PsychologyAltOutlined,
} from '@mui/icons-material'
import { TaskType } from '@zunou-graphql/core/graphql'
import { useCreateCompletionMutation } from '@zunou-queries/core/hooks/useCreateCompletionMutation'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { pathFor } from 'zunou-react/services/Routes'

import { useOrganization } from '~/hooks/useOrganization'
import { CLOSE_WELCOME_MESSAGE_KEY } from '~/pages/manager/PulseDetailPage/hooks'
import { Routes } from '~/services/Routes'
import { usePulseStore } from '~/store/usePulseStore'
import { getPrefixSegment } from '~/utils/urlUtils'
import { withStopPropagation } from '~/utils/withStopPropagation'

interface TaskAction {
  name: string
  message: (title: string, type: TaskType) => string
  icon: React.ElementType
  isActive: boolean
  onClick?: () => void
}

export const useHooks = ({
  title,
  type,
}: {
  title: string
  type: TaskType
}) => {
  const { t } = useTranslation(['common', 'tasks'])
  const { activeThreadId } = usePulseStore()
  const navigate = useNavigate()
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const { pathname: currentPath } = useLocation()

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const { mutateAsync: createCompletion } = useCreateCompletionMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
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

  const taskActions: TaskAction[] = [
    {
      icon: PsychologyAltOutlined,
      isActive: true,
      message: (title, type) => {
        const itemType = type === TaskType.List ? 'task list' : 'task'
        return `Explain this ${itemType}: ${title}`
      },
      name: 'Explain',
    },
    {
      icon: NoteOutlined,
      isActive: true,
      message: (title, type) => {
        const itemType = type === TaskType.List ? 'task list' : 'task'
        return `Summarize this ${itemType}: ${title}`
      },
      name: 'Summarize',
    },
    {
      icon: LiveHelpOutlined,
      isActive: true,
      message: (title, type) => {
        const itemType = type === TaskType.List ? 'task list' : 'task'

        return `I need help with this ${itemType}: ${title}`
      },
      name: 'Need Help',
    },
    {
      icon: AutoModeOutlined,
      isActive: false,
      message: (title, type) => {
        const itemType = type === TaskType.List ? 'task list' : 'task'
        return `Help me organize this ${itemType}: ${title}`
      },
      name: 'Organize',
    },
  ]

  const handleTaskAction = async (message: string) => {
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

  const options = taskActions.map(({ name, icon, isActive, message }) => ({
    icon,
    isActive,
    name,
    onClick: withStopPropagation(() => handleTaskAction(message(title, type))),
  }))

  return {
    anchorEl,
    handleAssistant,
    handleClick,
    handleClose,
    open,
    options,
    t,
  }
}
