import {
  ArrowForwardIosSharp,
  CalendarTodayOutlined,
  DeleteOutlined,
  DragIndicator,
  EditOutlined,
  PlaylistAddCheckOutlined,
} from '@mui/icons-material'
import { Box, Stack, Typography } from '@mui/material'
import { Task, TaskStatus, TaskType } from '@zunou-graphql/core/graphql'
import { IconButton } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import dayjs from 'dayjs'
import { truncate } from 'lodash'
import { useState } from 'react'

import { TaskDetailModal } from '../../../components/TaskDetailModal'
import { DeleteTaskListConfirmationModal } from '../DeleteTaskListConfirmationModal'
import { PulseTaskAssigneesGroup } from '../PulseTaskAssigneesGroup'
import { useHooks } from './hooks'
import { TaskAssistantDropdown } from './TaskAssistantDropdown'
import { TaskGroupPriority } from './TaskGroupPriority'
import { TasksCompletionCount } from './TasksCompletionCount'

export type TaskGroupProps = Pick<
  Task,
  'description' | 'id' | 'title' | 'order' | 'status'
> & {
  subtasks: Task['children']
  collapse: (id: string) => void
  expand: (id: string) => void
  isExpanded: boolean
  isOverlay?: boolean
}

export const TaskGroup = (task: TaskGroupProps) => {
  const {
    isOverlay = false,
    id: taskId,
    title,
    subtasks,
    description,
    isExpanded,
    expand,
    collapse,
  } = task

  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false)

  const {
    attributes,
    groupedAssignees,
    groupedDueDate,
    groupedSubtaskPriorities,
    handleCloseDeleteTaskListConfirmationModal,
    handleDeleteTask,
    handleOpenDeleteTaskListConfirmationModal,
    isTaskFilterActive,
    isDeleteConfirmationOpen,
    isDragging,
    isPendingDeleteTask,
    isTaskListActionShow,
    listeners,
    setIsTaskListActionShow,
    setNodeRef,
    taskListStatus,
    sortableStyle,
    isUsingMobileDevice,
    isDragDisabled,
  } = useHooks({ id: taskId, isOverlay, subtasks, title })

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsTaskDetailModalOpen(true)
  }

  const handleToggleAccordion = () => {
    if (isExpanded) collapse(taskId)
    else expand(taskId)
  }

  return (
    <Stack
      bgcolor={theme.palette.background.paper}
      py={2}
      ref={!isDragDisabled ? setNodeRef : undefined}
      style={sortableStyle}
      sx={{
        WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      <Stack
        direction="row"
        onMouseEnter={() => {
          if (!isUsingMobileDevice) setIsTaskListActionShow(true)
        }}
        onMouseLeave={() => {
          if (!isUsingMobileDevice) setIsTaskListActionShow(false)
        }}
        sx={{
          p: 0,
          textDecoration:
            taskListStatus === TaskStatus.Completed ? 'line-through' : 'none',
        }}
      >
        <Box
          sx={{
            alignSelf: 'center',
            cursor: isDragDisabled
              ? 'not-allowed'
              : isDragging
                ? 'grabbing'
                : 'grab',
            mr: 2,
            opacity:
              taskListStatus !== TaskStatus.Completed &&
              (isOverlay || isTaskListActionShow) &&
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

        {/* CLICKABLE CONTENT AREA - Separate from drag handle */}
        <Stack
          direction="row"
          onClick={handleToggleAccordion}
          spacing={1}
          sx={{
            cursor: 'pointer',
            flex: 1,
            // Ensure this doesn't interfere with dragging
            pointerEvents: isDragging ? 'none' : 'auto',
          }}
        >
          <IconButton
            sx={{
              alignSelf: 'flex-start',
              pointerEvents: isDragging ? 'none' : 'auto',
            }}
          >
            <ArrowForwardIosSharp
              fontSize="small"
              sx={{
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease-in-out',
              }}
            />
          </IconButton>
          <Stack alignItems="start" direction="row" flex={1} spacing={1}>
            <Stack alignItems="center" gap={1} height="100%">
              {/* Disable TaskStatusSelector for Task Lists */}
              {/* <TaskStatusSelector isViewMode={true} status={taskListStatus} /> */}
              {/* <Box
                border={1}
                borderColor={connectorColor}
                height="50%"
                visibility={isExpanded ? 'visible' : 'hidden'}
              /> */}
            </Stack>

            <Stack flex={1} minWidth={0} spacing={1}>
              <Typography>{title}</Typography>
              {description && (
                <Typography color={'text.secondary'} variant="body2">
                  {truncate(description, { length: 50 })}
                </Typography>
              )}
              <Stack alignItems="center" direction="row" spacing={3}>
                <Stack
                  alignItems="center"
                  color="text.secondary"
                  direction="row"
                  spacing={1}
                >
                  <PlaylistAddCheckOutlined />
                  <TasksCompletionCount tasks={subtasks} />
                </Stack>
                {groupedDueDate && (
                  <Stack direction="row" spacing={1}>
                    <CalendarTodayOutlined fontSize="small" />
                    <Typography fontSize={14}>
                      {dayjs(groupedDueDate).format('MMM D')}
                    </Typography>
                  </Stack>
                )}
                <TaskGroupPriority priorities={groupedSubtaskPriorities} />
                <PulseTaskAssigneesGroup
                  assignees={groupedAssignees}
                  size="small"
                />
              </Stack>
            </Stack>
          </Stack>
        </Stack>

        {/* TASK LIST ACTIONS - Separate from drag and click areas */}
        <Stack
          alignItems="center"
          direction="row"
          spacing={1}
          sx={{
            opacity: isTaskListActionShow ? 1 : 0,
            // Ensure these don't interfere with drag
            pointerEvents: isDragging ? 'none' : 'auto',

            transition: 'opacity 0.2s',
          }}
        >
          <TaskAssistantDropdown title={title} type={TaskType.List} />
          <Stack alignItems="center" direction="row">
            <IconButton onClick={handleEditClick}>
              <EditOutlined fontSize="small" />
            </IconButton>
            <IconButton
              color="error"
              onClick={(e) => {
                e.stopPropagation()
                handleOpenDeleteTaskListConfirmationModal(e)
              }}
            >
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Stack>

      <TaskDetailModal
        initialMode="edit"
        isOpen={isTaskDetailModalOpen}
        onClose={() => setIsTaskDetailModalOpen(false)}
        taskId={taskId}
      />

      <DeleteTaskListConfirmationModal
        isLoading={isPendingDeleteTask}
        isOpen={isDeleteConfirmationOpen}
        onClose={handleCloseDeleteTaskListConfirmationModal}
        onSubmit={handleDeleteTask}
      />
    </Stack>
  )
}
