import { ChecklistOutlined } from '@mui/icons-material'
import LoadingButton from '@mui/lab/LoadingButton'
import { alpha, Stack } from '@mui/system'
import { TaskPriority, TaskStatus, TaskType } from '@zunou-graphql/core/graphql'
import { useGetTasksQuery } from '@zunou-queries/core/hooks/useGetTasksQuery'
import { useUpdateTaskStatusMutation } from '@zunou-queries/core/hooks/useUpdateTaskStatusMutation'
import { Button } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Widget, WidgetKeysEnum } from '~/components/domain/vitals/widgets'
import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

import ActionButton from '../ActionButton'
import EmptyWidgetPlaceholder from '../EmptyWidgetPlaceholder'
import TaskCard from './components/TaskCard'

interface TasksWidgetProps {
  widgetId: string
  isExpanded?: boolean
  onExpand?: (isExpanded: boolean) => void
}

const TasksWidget = ({ widgetId, isExpanded, onExpand }: TasksWidgetProps) => {
  const { t } = useTranslation('vitals')
  const { user, userRole } = useAuthContext()
  const { setting } = useVitalsContext()
  const { organizationId } = useOrganization()
  const navigate = useNavigate()

  const isDarkMode = setting.theme === 'dark'

  const { data: tasksData, isLoading: isTasksLoading } = useGetTasksQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      assigneeId: user?.id,
      organizationId,
    },
  })

  const {
    mutateAsync: updateTaskStatus,
    isPending: isUpdateTaskStatusPending,
  } = useUpdateTaskStatusMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const [currentIndex, setCurrentIndex] = useState(0)

  const filteredTasks = useMemo(
    () =>
      tasksData?.tasks.filter(
        (task) =>
          task.status !== TaskStatus.Completed && task.type === TaskType.Task,
      ) ?? [],
    [tasksData],
  )

  const [localFilteredTasks, setLocalFilteredTasks] = useState(filteredTasks)

  useEffect(() => {
    setLocalFilteredTasks(filteredTasks)
  }, [filteredTasks])

  const currentTask = useMemo(
    () => localFilteredTasks[currentIndex] ?? null,
    [localFilteredTasks, currentIndex],
  )

  const rolePrefix = useMemo(() => userRole?.toLowerCase() ?? '', [userRole])

  const handleCompleteTask = async () => {
    if (!currentTask) return

    const updateInput = {
      organization_id: organizationId,
      status: TaskStatus.Completed,
      taskId: currentTask.id,
    }

    await updateTaskStatus(updateInput, {
      onError: () => toast.error(t('update_task_error')),
      onSuccess: () => {
        toast.success(t('update_task_success'))

        // update state manually, updateTask does not invalidate tasks cache
        setLocalFilteredTasks((prev) =>
          prev.filter((task) => task.id !== currentTask.id),
        )

        setCurrentIndex((prev) =>
          prev >= localFilteredTasks.length - 1 ? 0 : prev,
        )
      },
    })
  }
  const redirectHandler = (pulseId: string | null, taskId: string | null) => {
    if (!pulseId) return

    const query: Record<string, string> = {
      organizationId,
      pulseId,
      ...(taskId ? { id: taskId } : {}),
    }

    navigate(
      `/${rolePrefix}/${pathFor({
        pathname: Routes.PulseTasks,
        query,
      })}`,
    )
  }
  const handleNextTask = () => {
    setCurrentIndex((prev) => (prev + 1) % localFilteredTasks.length)
  }

  return (
    <Widget
      actions={
        localFilteredTasks.length > 0 && (
          <ActionButton
            handleClick={() =>
              redirectHandler(currentTask?.entity?.id ?? null, null)
            }
            text={t('see_all_tasks')}
          />
        )
      }
      id={WidgetKeysEnum.Tasks}
      isExpanded={isExpanded}
      isLoading={isTasksLoading}
      name={
        t('my_tasks') + (tasksData ? ` (${localFilteredTasks.length})` : '')
      }
      onExpand={onExpand}
      widgetId={widgetId}
    >
      {localFilteredTasks.length > 0 ? (
        <>
          {currentTask && (
            <TaskCard
              desc={currentTask.description ?? undefined}
              dueDate={currentTask.due_date ?? undefined}
              key={currentTask.id}
              onRedirect={() =>
                redirectHandler(currentTask?.entity?.id ?? null, currentTask.id)
              }
              priority={currentTask.priority ?? TaskPriority.Low}
              pulseName={currentTask.entity?.name ?? 'Unknown'}
              status={currentTask.status ?? TaskStatus.Todo}
              title={currentTask.title}
            />
          )}

          <Stack
            alignItems="center"
            direction="row"
            gap={1}
            height="20%"
            justifyContent="center"
          >
            <Button
              disabled={
                isUpdateTaskStatusPending || localFilteredTasks.length <= 1
              }
              fullWidth={true}
              onClick={handleNextTask}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                ...(isDarkMode && {
                  '&.Mui-disabled': {
                    bgcolor: 'grey.800',
                    border: 'none',
                    color: '#aaa',
                    opacity: 1,
                  },
                }),
              }}
              variant="outlined"
            >
              {t('do_later')}
            </Button>

            <LoadingButton
              disabled={isUpdateTaskStatusPending}
              fullWidth={true}
              loading={isUpdateTaskStatusPending}
              onClick={handleCompleteTask}
              sx={{
                border: 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textTransform: 'none',
                whiteSpace: 'nowrap',
                ...(isDarkMode && {
                  '&.Mui-disabled': {
                    bgcolor: 'grey.800',
                    color: '#fff',
                    opacity: 1,
                  },
                }),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.light, 0.2),
                  border: 'none',
                },
                bgcolor: alpha(theme.palette.primary.light, 0.1),
              }}
              variant="outlined"
            >
              {t('mark_done')}
            </LoadingButton>
          </Stack>
        </>
      ) : (
        <EmptyWidgetPlaceholder
          content={t('no_tasks')}
          icon={ChecklistOutlined}
        />
      )}
    </Widget>
  )
}

export default TasksWidget
