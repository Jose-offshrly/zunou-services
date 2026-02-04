import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  CalendarTodayOutlined,
  DeleteOutlined,
  DragIndicator,
  EditOutlined,
  Flag,
} from '@mui/icons-material'
import { Divider, Fade, IconButton, Typography } from '@mui/material'
import { alpha, Box, Stack } from '@mui/system'
import { useQueryClient } from '@tanstack/react-query'
import {
  PulseCategory,
  PulseStatusOption,
  Task,
  TaskStatus,
  TaskType,
} from '@zunou-graphql/core/graphql'
import { useDeleteTaskMutation } from '@zunou-queries/core/hooks/useDeleteTaskMutation'
import { useGetTaskStatusesQuery } from '@zunou-queries/core/hooks/useGetTaskStatusesQuery'
import { useUpdateTaskStatusMutation } from '@zunou-queries/core/hooks/useUpdateTaskStatusMutation'
import { theme } from '@zunou-react/services/Theme'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { useOrganization } from '~/hooks/useOrganization'
import { usePulseStore } from '~/store/usePulseStore'
import { useTaskStore } from '~/store/useTaskStore'
import { getPulseTaskPriorityColor } from '~/utils/getPulseTaskPriorityColor'
import { isMobileDevice } from '~/utils/mobileDeviceUtils'
import { toTitleCase } from '~/utils/toTitleCase'

import { TaskDetailModal } from '../../../components/TaskDetailModal'
import { StatusDropdown } from '../CreateTaskForm/StatusDropdown'
import { DeleteTaskConfirmationModal } from '../DeleteTaskConfirmationModal'
import { PulseTaskAssigneesGroup } from '../PulseTaskAssigneesGroup'
import { TaskAssistantDropdown } from '../TaskGroup/TaskAssistantDropdown'

export type TaskItem = Pick<
  Task,
  | 'assignees'
  | 'id'
  | 'description'
  | 'priority'
  | 'title'
  | 'parent'
  | 'entity'
> & {
  status: TaskStatus | string | undefined | null
  dueDate: Task['due_date']
  isOverlay?: boolean
  isLastChild?: boolean
  onClick?: (taskId: string) => void
}

export const TaskItem = (task: TaskItem) => {
  const {
    assignees,
    dueDate,
    id: taskId,
    priority,
    status,
    title,
    description,
    parent,
    entity,
    isOverlay = false,
    isLastChild = false,
    onClick,
  } = task

  const { t } = useTranslation('tasks')
  const queryClient = useQueryClient()
  const { isUpdatingTaskOrder, isTaskFilterActive } = useTaskStore()
  const { organizationId } = useOrganization()
  const { pulse, pulseStatusOption } = usePulseStore()

  const [isTaskActionShow, setIsTaskActionShow] = useState(isMobileDevice())
  const [isUsingMobileDevice, setIsUsingMobileDevice] = useState(false)
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false)
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false)

  const isPersonalPulse = pulse?.category === PulseCategory.Personal

  const { mutate: updateTaskStatus, isPending: isPendingUpdateTask } =
    useUpdateTaskStatusMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsTaskDetailModalOpen(true)
  }

  useEffect(() => {
    setIsUsingMobileDevice(isMobileDevice())
  }, [setIsUsingMobileDevice])

  useEffect(() => {
    const handleResize = () => {
      // Show task actions by default in mobile
      setIsTaskActionShow(isMobileDevice())
      setIsUsingMobileDevice(isMobileDevice())
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    data: { hasParent: Boolean(parent), title, type: TaskType.Task },
    disabled: isUpdatingTaskOrder,
    id: taskId,
  })

  const sortableStyle: React.CSSProperties = {
    boxShadow: isOverlay ? '0 5px 10px rgba(0, 0, 0, 0.2)' : 'none',
    cursor: 'default',
    position: 'relative',
    transform: CSS.Transform.toString(transform),
    transition,
    userSelect: 'none',
    visibility: !isOverlay && isDragging ? 'hidden' : 'visible',
    zIndex: transform ? 999 : 'auto',
  }

  const { mutate: deleteTask, isPending: isPendingDeleteTask } =
    useDeleteTaskMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handleOpenDeleteTaskConfirmationModal = () => {
    setIsDeleteConfirmationOpen(true)
  }
  const handleCloseDeleteTaskConfirmationModal = () => {
    setIsDeleteConfirmationOpen(false)
  }

  // Fetch task statuses based on statusOption
  const shouldFetchDefaults = pulseStatusOption === PulseStatusOption.Default
  const isUsingCustomStatuses =
    pulseStatusOption === PulseStatusOption.Custom && Boolean(pulse?.id)

  const { data: taskStatusesData } = useGetTaskStatusesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: isUsingCustomStatuses,
    variables: shouldFetchDefaults
      ? { defaults: true }
      : isUsingCustomStatuses && pulse?.id
        ? { pulseId: pulse?.id }
        : undefined,
  })

  const customStatuses = taskStatusesData?.taskStatuses

  const handleDeleteTask = () => {
    deleteTask(
      {
        id: taskId,
      },
      {
        onError: () => toast.error(t('task_deletion_error')),
        onSettled: () => setIsDeleteConfirmationOpen(false),
        onSuccess: async () => {
          toast.success(t('task_deletion_success'))

          await queryClient.invalidateQueries({
            queryKey: ['tasks'],
          })
        },
      },
    )
  }

  // Check if drag should be disabled
  const isDragDisabled =
    isUpdatingTaskOrder || status === TaskStatus.Completed || isTaskFilterActive

  const connectorColor = alpha(theme.palette.secondary.light, 0.2)

  const handleStatusSelect = ({ status }: { status: TaskStatus | string }) => {
    const updateInput = {
      organization_id: organizationId,
      taskId,
      ...(isUsingCustomStatuses
        ? { task_status_id: status }
        : { status: status as TaskStatus }),
    }

    updateTaskStatus(updateInput, {
      onError: () => {
        toast.error(t('task_update_error'))
      },
      onSuccess: () => {
        toast.success(t('task_update_success'))
      },
    })
  }

  return (
    <Stack
      alignItems="center"
      bgcolor={theme.palette.background.paper}
      direction="row"
      id={`task-${taskId}`}
      justifyContent="space-between"
      onMouseEnter={() => {
        if (!isUsingMobileDevice) setIsTaskActionShow(true)
      }}
      onMouseLeave={() => {
        if (!isUsingMobileDevice) setIsTaskActionShow(false)
      }}
      py={2}
      ref={!isDragDisabled ? setNodeRef : undefined}
      style={sortableStyle}
      sx={{
        WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      <Stack
        alignItems="center"
        direction="row"
        height="100%"
        justifyContent="space-between"
        width="100%"
      >
        <Box
          sx={{
            cursor: isDragDisabled
              ? 'not-allowed'
              : isDragging
                ? 'grabbing'
                : 'grab',
            mr: 2,
            opacity:
              status !== TaskStatus.Completed &&
              (isOverlay || isTaskActionShow) &&
              !isTaskFilterActive
                ? 1
                : 0,
            pointerEvents: isDragDisabled ? 'none' : 'auto',
            touchAction: 'none',
            transition: 'opacity 0.2s',
          }}
          {...(!isDragDisabled ? attributes : {})}
          {...(!isDragDisabled ? listeners : {})}
        >
          <DragIndicator fontSize="small" />
        </Box>

        <Stack
          alignItems="center"
          direction="row"
          flex={1}
          height="100%"
          minWidth={0}
          onClick={() => {
            if (!isDragging) onClick?.(taskId)
          }}
          spacing={1}
          sx={{
            cursor: 'pointer',
            textDecoration:
              status === TaskStatus.Completed ? 'line-through' : null,
          }}
        >
          {parent ? (
            <Stack alignItems="center" direction="row" height="100%">
              <Stack height="100%">
                <Box
                  border={1}
                  borderColor={connectorColor}
                  height={isLastChild ? '50%' : '100%'}
                  width={0.5}
                />
              </Stack>
              <Stack alignItems="center" direction="row" gap={1}>
                <Box
                  border={1}
                  borderColor={connectorColor}
                  height={0.5}
                  width={30}
                />
                <StatusDropdown
                  badgeOnly={true}
                  customStatuses={
                    pulseStatusOption === PulseStatusOption.Custom
                      ? customStatuses
                      : undefined
                  }
                  disabled={isPendingUpdateTask}
                  onSelect={(status) => handleStatusSelect({ status })}
                  selectedStatus={status}
                />
              </Stack>
            </Stack>
          ) : (
            <StatusDropdown
              badgeOnly={true}
              customStatuses={
                pulseStatusOption === PulseStatusOption.Custom
                  ? customStatuses
                  : undefined
              }
              disabled={isPendingUpdateTask}
              onSelect={(status) => handleStatusSelect({ status })}
              selectedStatus={status}
            />
          )}

          <Stack flex={1} justifyContent="center" minWidth={0} spacing={1}>
            <Typography
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {title}
            </Typography>
            {description && (
              <Typography
                color="text.secondary"
                overflow="hidden"
                textOverflow="ellipsis"
                variant="body2"
                whiteSpace="nowrap"
              >
                {description}
              </Typography>
            )}
            {(dueDate || priority || entity?.name || isPersonalPulse) && (
              <Stack
                direction="row"
                divider={
                  <Divider orientation="vertical" sx={{ height: 'auto' }} />
                }
                flex={1}
                spacing={2}
              >
                {dueDate && (
                  <Stack direction="row" spacing={1}>
                    <CalendarTodayOutlined fontSize="small" />
                    <Typography fontSize={14}>
                      {dayjs(dueDate).format('MMM D')}
                    </Typography>
                  </Stack>
                )}

                {priority && (
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ color: getPulseTaskPriorityColor(priority) }}
                  >
                    <Flag fontSize="small" />
                    <Typography fontSize={14}>
                      {toTitleCase(priority)}
                    </Typography>
                  </Stack>
                )}

                {isPersonalPulse && (
                  <Typography
                    color="primary.main"
                    fontSize={14}
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                  >
                    {entity?.name ?? 'One-to-One Pulse'}
                  </Typography>
                )}
              </Stack>
            )}
          </Stack>
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            pointerEvents: 'auto',
          }}
        >
          <Fade in={isTaskActionShow} timeout={200}>
            <Stack direction="row">
              <TaskAssistantDropdown title={title} type={TaskType.Task} />
              <IconButton onClick={handleEditClick}>
                <EditOutlined fontSize="small" />
              </IconButton>
              <IconButton
                color="error"
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenDeleteTaskConfirmationModal()
                }}
              >
                <DeleteOutlined fontSize="small" />
              </IconButton>
            </Stack>
          </Fade>
          <PulseTaskAssigneesGroup assignees={assignees} />
        </Stack>
      </Stack>

      <TaskDetailModal
        initialMode="edit"
        isOpen={isTaskDetailModalOpen}
        onClose={() => setIsTaskDetailModalOpen(false)}
        taskId={taskId}
      />

      <DeleteTaskConfirmationModal
        isLoading={isPendingDeleteTask}
        isOpen={isDeleteConfirmationOpen}
        onClose={handleCloseDeleteTaskConfirmationModal}
        onSubmit={handleDeleteTask}
        task={task}
      />
    </Stack>
  )
}
