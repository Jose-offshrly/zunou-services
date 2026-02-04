import { CalendarTodayOutlined, Flag } from '@mui/icons-material'
import { Typography } from '@mui/material'
import { Stack } from '@mui/system'
import {
  TaskPriority,
  TaskStatus,
  TaskType,
  User,
} from '@zunou-graphql/core/graphql'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import { TaskStatusIndicator } from '~/pages/manager/PulseTaskPage/View/ListView/TaskStatusIndicator'
import { Routes } from '~/services/Routes'
import { extractBetweenPatterns } from '~/utils/extractBetweenPatterns'
import { getPulseTaskPriorityColor } from '~/utils/getPulseTaskPriorityColor'
import { toTitleCase } from '~/utils/toTitleCase'

import FeedCard from '../components/FeedCard'
import PreviewContainer from '../components/PreviewContainer'
import TimeAgo from '../components/TimeAgo'

interface TaskCreatedFeedProps {
  dateString: string
  description: string
  organizationId: string
  pulseId?: string | null
  causer: User | null
  task: {
    id: string
    title: string
    description: string
    status: TaskStatus
    priority: TaskPriority
    dueDate: string
    type: TaskType
  }
}

const Metadata = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <Stack alignItems="center" direction="row" gap={1}>
    <Typography color="text.secondary" variant="body2">
      {label}:
    </Typography>
    {children}
  </Stack>
)

const TaskCreatedFeed = ({
  dateString,
  description,
  organizationId,
  pulseId = null,
  causer,
  task,
}: TaskCreatedFeedProps) => {
  const { userRole } = useAuthContext()
  const navigate = useNavigate()

  const rolePrefix = useMemo(() => userRole?.toLowerCase() ?? '', [userRole])

  const onClickHandler = () => {
    if (!pulseId) {
      toast.error('Missing pulse id')
      return
    }

    if (!task.id) {
      toast.error('Missing task id')
      return
    }

    navigate(
      `/${rolePrefix}/${pathFor({
        pathname: Routes.PulseTasks,
        query: { id: task.id, organizationId, pulseId },
      })}`,
    )
  }

  const pulseName = useMemo(() => {
    return extractBetweenPatterns(description, 'in the ')
  }, [description])

  return (
    <FeedCard direction="row" gap={2} onClick={onClickHandler}>
      <Avatar
        placeholder={causer?.name}
        src={causer?.gravatar}
        variant="circular"
      />
      <Stack gap={2}>
        <Stack>
          <Typography fontWeight="bold" variant="body1">
            {causer?.name}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Created a new{' '}
            <Typography
              color="text.primary"
              component="span"
              fontWeight="bold"
              variant="body2"
            >
              {task.type === TaskType.List ? 'Task List ' : 'Task '}{' '}
            </Typography>
            in{' '}
            <Typography
              color="text.primary"
              component="span"
              fontWeight="bold"
              variant="body2"
            >
              {pulseName}
            </Typography>
          </Typography>
        </Stack>
        <PreviewContainer color={theme.palette.primary.main}>
          <Stack gap={1}>
            <Typography
              color="text.primary"
              component="span"
              fontWeight="bold"
              variant="body2"
            >
              {task.title}
            </Typography>
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: 'small',
              }}
            >
              {task.description}
            </Typography>

            <Stack alignItems="center" direction="row" flexWrap="wrap" gap={3}>
              {task.status && (
                <Metadata label="Status">
                  <TaskStatusIndicator size="small" status={task.status} />
                </Metadata>
              )}

              <Metadata label="Priority">
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ color: getPulseTaskPriorityColor(task.priority) }}
                >
                  <Flag fontSize="small" />
                  <Typography fontSize={14}>
                    {toTitleCase(TaskPriority.Medium)}
                  </Typography>
                </Stack>
              </Metadata>

              <Metadata label="Due Date">
                <Stack direction="row" spacing={1}>
                  <CalendarTodayOutlined fontSize="small" />
                  <Typography fontSize={14}>
                    {task.dueDate
                      ? dayjs(task.dueDate).format('MMM D')
                      : 'No Due Date'}
                  </Typography>
                </Stack>
              </Metadata>
            </Stack>
          </Stack>
        </PreviewContainer>

        <TimeAgo dateString={dateString} />
      </Stack>
    </FeedCard>
  )
}

export default TaskCreatedFeed
