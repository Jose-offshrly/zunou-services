import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  CalendarTodayOutlined,
  EditOutlined,
  FormatListBulletedOutlined,
  TaskOutlined,
} from '@mui/icons-material'
import {
  Avatar,
  AvatarGroup,
  Box,
  Fade,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import {
  Task,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '@zunou-graphql/core/graphql'
import { Chip } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs from 'dayjs'
import _ from 'lodash'
import { useState } from 'react'

import { TaskDetailModal } from '../../components'
import { TaskAssistantDropdown } from '../ListView/TaskGroup/TaskAssistantDropdown'

interface KanbanCardProps {
  task: Task
  onClick: () => void
}

interface KanbanCardPropsWithDrag extends KanbanCardProps {
  isDragging: boolean
}

const PRIORITY_COLOR_MAP: Record<TaskPriority, { bg: string; text: string }> = {
  [TaskPriority.Urgent]: { bg: '#fee2e2', text: '#991b1b' }, // Red
  [TaskPriority.High]: { bg: '#fed7aa', text: '#9a3412' }, // Orange
  [TaskPriority.Medium]: { bg: '#dbeafe', text: '#1e40af' }, // Blue
  [TaskPriority.Low]: { bg: '#dcfce7', text: '#166534' }, // Green
}

export default function KanbanCard({
  task,
  onClick,
  isDragging,
}: KanbanCardPropsWithDrag) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      data: {
        item: task,
        type: 'task',
      },
      id: task.id,
    })

  const { user } = useAuthContext()

  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false)
  const [isTaskActionShow, setIsTaskActionShow] = useState(false)

  const timezone = user?.timezone ?? 'UTC'

  const dueDate = task.due_date
    ? dayjs.tz(task.due_date, timezone).format('MMM DD, YYYY')
    : 'No due date'

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.5 : 1,
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if we're not currently dragging
    // @dnd-kit's activation constraint (8px) means clicks won't trigger drags
    if (!isDragging) {
      e.stopPropagation()
      onClick()
    }
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsTaskDetailModalOpen(true)
  }

  const priority = task.priority || TaskPriority.Low
  const priorityColors = PRIORITY_COLOR_MAP[priority]

  // Get remaining assignees for the +N tooltip
  // const remainingAssignees = task.assignees?.slice(3) || []

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        '&:active': {
          cursor: 'grabbing',
        },
        '&:hover': {
          boxShadow: 2,
        },
        backgroundColor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        cursor: 'grab',
        p: 1.5,
      }}
      {...attributes}
      {...listeners}
    >
      <Stack
        gap={1}
        onClick={handleClick}
        onMouseEnter={() => setIsTaskActionShow(true)}
        onMouseLeave={() => setIsTaskActionShow(false)}
      >
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
        >
          <Typography
            fontWeight={500}
            sx={{
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 3,
              display: '-webkit-box',
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              pr: 1,
            }}
            variant="body2"
          >
            {task.title}
          </Typography>

          {/* action buttons only visible on hover */}
          <Fade in={isTaskActionShow}>
            <Stack
              direction="row"
              onClick={(e) => e.stopPropagation()}
              sx={{ flexShrink: 0 }}
            >
              <TaskAssistantDropdown title={task.title} />

              <IconButton onClick={handleEditClick}>
                <EditOutlined fontSize="small" />
              </IconButton>
            </Stack>
          </Fade>
        </Stack>

        {task.description && (
          <Typography
            color="text.secondary"
            sx={{
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              display: '-webkit-box',
              overflow: 'hidden',
            }}
            variant="caption"
          >
            {task.description}
          </Typography>
        )}

        {task.parent && (
          <Stack alignItems="center" direction="row" gap={1}>
            <FormatListBulletedOutlined
              sx={{
                color: 'text.secondary',
                fontSize: 12,
              }}
            />

            <Typography
              color="text.secondary"
              component="span"
              variant="caption"
            >
              {task.parent?.title}
            </Typography>
          </Stack>
        )}

        <Stack alignItems="center" direction="row" gap={1}>
          <CalendarTodayOutlined
            sx={{
              color: 'text.secondary',
              fontSize: 12,
            }}
          />

          <Typography color="text.secondary" variant="caption">
            {dueDate}
          </Typography>
        </Stack>
        <Stack
          alignItems="center"
          direction="row"
          justifyContent={'space-between'}
        >
          <Stack>
            <Chip
              label={_.startCase(_.toLower(priority))}
              size="small"
              sx={{
                backgroundColor: priorityColors.bg,
                borderRadius: 1.5,
                color: priorityColors.text,
                fontSize: 12,
                fontWeight: 500,
                p: 0.2,
              }}
            />
          </Stack>
          {task.assignees && task.assignees.length > 0 && (
            <AvatarGroup
              componentsProps={{
                additionalAvatar: {
                  sx: {
                    fontSize: 10,
                    height: 20,
                    width: 20,
                  },
                },
              }}
              max={3}
              renderSurplus={(surplus) => (
                <Avatar sx={{ fontSize: 10, height: 20, width: 20 }}>
                  +{surplus}
                </Avatar>
              )}
              sx={{
                '& .MuiAvatar-root': {
                  fontSize: 10,
                  height: 20,
                  width: 20,
                },
              }}
            >
              {task.assignees.map((assignee) => (
                <Avatar
                  key={assignee.id}
                  src={assignee.user.gravatar ?? undefined}
                  sx={{ height: 20, width: 20 }}
                >
                  {assignee.user.name[0]}
                </Avatar>
              ))}
            </AvatarGroup>
          )}
        </Stack>

        {task.type === TaskType.List && (
          <Stack alignItems="center" direction="row" gap={1}>
            <TaskOutlined
              sx={{
                color: 'text.secondary',
                fontSize: 12,
              }}
            />

            <Typography color="text.secondary" variant="caption">
              {
                (task.children ?? []).filter(
                  (sub) => sub.status === TaskStatus.Completed,
                ).length
              }
              /{task.children?.length ?? 0}
            </Typography>
          </Stack>
        )}
      </Stack>

      <TaskDetailModal
        initialMode="edit"
        isOpen={isTaskDetailModalOpen}
        onClose={() => setIsTaskDetailModalOpen(false)}
        taskId={task.id}
      />
    </Box>
  )
}
