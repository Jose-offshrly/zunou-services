import {
  ChecklistOutlined,
  ExpandMoreOutlined,
  NoteOutlined,
  SmartToyOutlined,
} from '@mui/icons-material'
import { Icon, Menu, MenuItem, Stack, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { DataSourceStatus } from '@zunou-graphql/core/graphql'
import { useCreateCompletionMutation } from '@zunou-queries/core/hooks/useCreateCompletionMutation'
import zunouChatIcon from '@zunou-react/assets/images/zunou-chat-icon.svg'
import { Button } from '@zunou-react/components/form'
import { Image } from '@zunou-react/components/utility'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { SideTrayTarget } from '~/components/domain/pulse/PulseChatSideTray'
import { useOrganization } from '~/hooks/useOrganization'
import { usePusherChannel } from '~/hooks/usePusherChannel'
import { Routes } from '~/services/Routes'
import { ShowPulseWelcomeState, usePulseStore } from '~/store/usePulseStore'
import { getPrefixSegment } from '~/utils/urlUtils'
import { withStopPropagation } from '~/utils/withStopPropagation'

interface AssistantDropdownProps {
  dataSourceId: string
  dataSourceName: string
  onCreateTasks?: () => void
  dataSourceStatus: DataSourceStatus
}

export const AssistantDropdown = ({
  dataSourceId,
  dataSourceName,
  onCreateTasks,
  dataSourceStatus,
}: AssistantDropdownProps) => {
  const { activeThreadId, pulseWelcomeState, setPulseWelcomeState } =
    usePulseStore()
  const navigate = useNavigate()
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const { pathname: currentPath } = useLocation()
  const queryClient = useQueryClient()

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  usePusherChannel({
    channelName: dataSourceId && `data-source.${dataSourceId}`,
    eventName: '.data-source-status-updated',
    onEvent: () => {
      queryClient.invalidateQueries({
        queryKey: ['dataSources', organizationId, pulseId, dataSourceId],
      })
    },
  })

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

    onCreateTasks?.()
  }

  const taskActions = [
    {
      icon: NoteOutlined,
      isActive: true,
      key: SideTrayTarget.SUMMARY,
      message: (title: string) =>
        `Generate a clear and concise summary of the meeting titled: "${title}"`,
      name: 'Summarize',
    },
    {
      icon: SmartToyOutlined,
      isActive: true,
      key: SideTrayTarget.STRATEGIES,
      message: (title: string) =>
        `List key strategies and insights discussed in the meeting: "${title}"`,
      name: 'Strategies',
    },
    {
      icon: ChecklistOutlined,
      isActive: true,
      key: SideTrayTarget.ACTION_ITEMS,
      message: (title: string) =>
        `Based on the meeting "${title}", create actionable tasks and next steps`,
      name: 'Action Items',
    },
  ]

  const closeWelcomeMessage = () => {
    if (!pulseId) return

    const updatedWelcomeState = [...pulseWelcomeState]

    const pulse = updatedWelcomeState.find((pulse) => pulse.pulseId === pulseId)

    if (pulse)
      setPulseWelcomeState(
        updatedWelcomeState.map((pulse) =>
          pulse.pulseId === pulseId
            ? { ...pulse, state: ShowPulseWelcomeState.Hidden }
            : pulse,
        ),
      )
    else {
      updatedWelcomeState.push({
        initialData: null,
        pulseId,
        state: ShowPulseWelcomeState.Hidden,
      })

      setPulseWelcomeState(updatedWelcomeState)
    }
  }

  const handleTaskAction = async (message: string) => {
    if (!activeThreadId) return

    navigateToPulseChat()

    try {
      const metadata = JSON.stringify(
        dataSourceId ? { data_source_id: dataSourceId } : {},
      )

      // Close pulse welcome message if open
      closeWelcomeMessage()

      await createCompletion({
        message,
        metadata,
        organizationId,
        threadId: activeThreadId,
      })
    } catch (error) {
      console.error(error)
    }
  }

  const options = taskActions.map(({ name, icon, isActive, message }) => ({
    icon,
    isActive,
    name,
    onClick: withStopPropagation(() =>
      handleTaskAction(message(dataSourceName)),
    ),
  }))

  return (
    <>
      <Button
        disabled={dataSourceStatus !== DataSourceStatus.Indexed}
        onClick={withStopPropagation(handleClick)}
        size="small"
        sx={{
          bgcolor: 'background.paper',
          borderColor: 'divider',
        }}
        variant="outlined"
      >
        <Image
          alt="Logo"
          height={24}
          src={zunouChatIcon}
          style={{ display: 'block' }}
        />
        <ExpandMoreOutlined fontSize="small" />
      </Button>
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
