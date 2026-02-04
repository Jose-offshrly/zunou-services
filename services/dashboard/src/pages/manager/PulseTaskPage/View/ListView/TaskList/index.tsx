import { DndContext, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Divider, Stack } from '@mui/material'
import { PulseStatusOption, Task, TaskType } from '@zunou-graphql/core/graphql'
import { useGetTaskStatusesQuery } from '@zunou-queries/core/hooks/useGetTaskStatusesQuery'
import React, { memo, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { usePulseStore } from '~/store/usePulseStore'
import { useTaskStore } from '~/store/useTaskStore'
import { isLastChild } from '~/utils/taskDragAndDropUtils'

import { useTimelineStore } from '../../../store/useTimelineStore'
import {
  getAllChildrenTasks,
  GroupByField,
  groupTasks,
  sortTasks,
  TaskSortConfig,
} from '../../../utils/taskGrouping'
import { TaskGroup } from '../TaskGroup'
import { TaskGroupSection } from '../TaskGroupSection'
import { TaskItem } from '../TaskItem'
import AddTaskButton from './components/AddTaskButton'
import { useHooks } from './hooks'

const MemoizedTaskGroup = memo(TaskGroup)
const MemoizedTaskItem = memo(TaskItem)
const MemoizedAddTaskButton = memo(AddTaskButton)

interface PulseTaskListProps {
  onSelect: (taskId: string) => void
}

export const PulseTaskList = ({ onSelect }: PulseTaskListProps) => {
  const {
    sensors,
    handleDragEnd,
    handleDragStart,
    handleDragMove,
    rootTasks,
    activeTask,
    expandList,
    collapseList,
    isUpdatingTaskOrder,
    isListExpanded,
    sortableItems,
  } = useHooks()

  const { pulseId } = useParams<{ pulseId: string }>()
  const { pulseTasks } = useTaskStore()
  const { pulseStatusOption } = usePulseStore()
  const viewConfig = useTimelineStore((state) => state.viewConfig)
  const groupByField = viewConfig.groupBy.field as GroupByField
  const sortConfig = viewConfig.sort as TaskSortConfig | null
  const isUsingCustomStatuses = pulseStatusOption === PulseStatusOption.Custom

  // Fetch custom statuses when using custom status option and (grouping OR sorting) by status
  const shouldFetchCustomStatuses =
    isUsingCustomStatuses &&
    !!pulseId &&
    (groupByField === 'status' || sortConfig?.field === 'status')

  const { data: taskStatusesData } = useGetTaskStatusesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: shouldFetchCustomStatuses,
    variables: {
      pulseId: pulseId!,
    },
  })

  const customStatuses = taskStatusesData?.taskStatuses ?? []

  const taskGroups = useMemo(() => {
    if (!groupByField) return null

    const nonListTasks = pulseTasks.filter(
      (task) => task.type !== TaskType.List,
    )
    const childTasks = getAllChildrenTasks(pulseTasks)

    // set up sort direction for grouping
    const isSortingByGroupField = sortConfig?.field === groupByField
    const sortDirectionForGroups =
      isSortingByGroupField && sortConfig ? sortConfig.direction : undefined

    const groups = groupTasks(
      [...nonListTasks, ...childTasks],
      groupByField,
      sortDirectionForGroups,
      isUsingCustomStatuses,
      customStatuses,
    )

    // Apply sorting WITHIN each group if sort config is set and different from group field
    if (sortConfig?.field && !isSortingByGroupField) {
      return groups.map((group) => ({
        ...group,
        tasks: sortTasks(
          group.tasks,
          sortConfig,
          isUsingCustomStatuses,
          customStatuses,
        ),
      }))
    }

    return groups
  }, [
    groupByField,
    pulseTasks,
    sortConfig,
    isUsingCustomStatuses,
    customStatuses,
  ])

  // apply sorting to non-grouped tasks
  const sortedRootTasks = useMemo(() => {
    if (!sortConfig?.field) return rootTasks

    const taskLists: typeof rootTasks = []
    const orphanTasks: typeof rootTasks = []
    const taskListChildrenMap = new Map<string, typeof rootTasks>()

    for (const task of rootTasks) {
      if (task.type === TaskType.List) {
        taskLists.push(task)
        taskListChildrenMap.set(task.id, [])
      } else if (task.parent) {
        // Add child tasks to parent list
        const parentId = task.parent.id
        if (!taskListChildrenMap.has(parentId)) {
          taskListChildrenMap.set(parentId, [])
        }
        taskListChildrenMap.get(parentId)!.push(task)
      } else {
        orphanTasks.push(task)
      }
    }

    // Sort task lists based on their children's effective status/priority/dueDate
    const topLevelItems = [...taskLists, ...orphanTasks]
    const sortedTopLevel = sortTasks(
      [...topLevelItems],
      sortConfig,
      isUsingCustomStatuses,
      customStatuses,
    )

    // insert sorted children to a task list if task is a list
    const finalResult: typeof rootTasks = []
    for (const task of sortedTopLevel) {
      finalResult.push(task)
      if (task.type === TaskType.List) {
        const children = taskListChildrenMap.get(task.id) || []
        if (children.length > 0) {
          const sortedChildren = sortTasks(
            [...children],
            sortConfig,
            isUsingCustomStatuses,
            customStatuses,
          )
          finalResult.push(...sortedChildren)
        }
      }
    }

    return finalResult
  }, [rootTasks, sortConfig, isUsingCustomStatuses, customStatuses])

  const dragOverlayContent = useMemo(() => {
    if (!activeTask) return null

    return (
      <Stack style={{ opacity: 1, width: '100%' }}>
        {activeTask.type === TaskType.List ? (
          <MemoizedTaskGroup
            collapse={collapseList}
            description={activeTask.description}
            expand={expandList}
            id={activeTask.id}
            isExpanded={isListExpanded(activeTask.id)}
            isOverlay={true}
            status={activeTask.status}
            subtasks={activeTask.children}
            title={activeTask.title}
          />
        ) : (
          <MemoizedTaskItem
            assignees={activeTask.assignees}
            description={activeTask.description}
            dueDate={activeTask.due_date}
            id={activeTask.id}
            isOverlay={true}
            parent={activeTask.parent}
            priority={activeTask.priority}
            status={
              isUsingCustomStatuses && activeTask.task_status_id
                ? activeTask.task_status_id
                : activeTask.status
            }
            title={activeTask.title}
          />
        )}
      </Stack>
    )
  }, [activeTask, collapseList, expandList, isListExpanded])

  const renderedTasks = useMemo(() => {
    return sortedRootTasks.map((task) => {
      const {
        assignees,
        description,
        due_date,
        id,
        priority,
        title,
        type,
        status,
        parent,
        children: subtasks,
        entity,
        task_status_id,
      } = task

      if (type === TaskType.List) {
        const isExpanded = isListExpanded(id)
        const hasNoSubtasks = (subtasks?.length ?? 0) <= 0
        const showAddButton =
          !activeTask && !isUpdatingTaskOrder && isExpanded && hasNoSubtasks

        return (
          <React.Fragment key={id}>
            <MemoizedTaskGroup
              collapse={collapseList}
              description={description}
              expand={expandList}
              id={id}
              isExpanded={isExpanded}
              status={status}
              subtasks={subtasks}
              title={title}
            />
            {showAddButton && (
              <Stack key={`${id}-add-task-btn`} ml={10}>
                <MemoizedAddTaskButton parentId={id} />
              </Stack>
            )}
          </React.Fragment>
        )
      }

      if (!parent || isListExpanded(parent.id)) {
        const isTaskLastChild = isLastChild(sortedRootTasks, id)
        const showAddButton =
          !activeTask &&
          type === TaskType.Task &&
          parent &&
          !isUpdatingTaskOrder &&
          isListExpanded(parent.id) &&
          isTaskLastChild

        return (
          <Stack key={id} ml={parent ? 7.5 : 0}>
            <MemoizedTaskItem
              assignees={assignees}
              description={description}
              dueDate={due_date}
              entity={entity}
              id={id}
              isLastChild={isTaskLastChild}
              onClick={onSelect}
              parent={parent}
              priority={priority}
              status={
                isUsingCustomStatuses && task_status_id
                  ? task_status_id
                  : status
              }
              title={title}
            />
            {showAddButton && <MemoizedAddTaskButton parentId={parent.id} />}
          </Stack>
        )
      }

      return null
    })
  }, [
    sortedRootTasks,
    isListExpanded,
    activeTask,
    isUpdatingTaskOrder,
    collapseList,
    expandList,
  ])

  const renderTaskItem = (task: Task, showAddButton = false) => {
    const {
      assignees,
      description,
      due_date,
      id,
      priority,
      title,
      status,
      parent,
      entity,
      task_status_id,
    } = task

    const isTaskLastChild = isLastChild(sortedRootTasks, id)

    return (
      <Stack key={id} ml={parent ? 7.5 : 0}>
        <MemoizedTaskItem
          assignees={assignees}
          description={description}
          dueDate={due_date}
          entity={entity}
          id={id}
          isLastChild={isTaskLastChild}
          onClick={onSelect}
          parent={parent}
          priority={priority}
          status={
            isUsingCustomStatuses && task_status_id ? task_status_id : status
          }
          title={title}
        />
        {showAddButton && parent && (
          <MemoizedAddTaskButton parentId={parent.id} />
        )}
      </Stack>
    )
  }

  const renderedGroupedTasks = useMemo(() => {
    if (!taskGroups) return null

    return taskGroups.map((group) => {
      return (
        <TaskGroupSection
          groupColor={group.color}
          groupLabel={group.groupLabel}
          key={group.groupKey}
          taskCount={group.tasks.length}
        >
          {group.tasks.map((task) => renderTaskItem(task, false))}
        </TaskGroupSection>
      )
    })
  }, [taskGroups, pulseTasks, onSelect, sortedRootTasks])

  return (
    <>
      <DndContext
        onDragEnd={handleDragEnd}
        onDragMove={handleDragMove}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <SortableContext
          items={sortableItems}
          strategy={verticalListSortingStrategy}
        >
          {groupByField ? (
            // grouped tasks view
            <Stack spacing={2}>{renderedGroupedTasks}</Stack>
          ) : (
            // normal, ungrouped view of tasks
            <Stack
              bgcolor={(theme) => theme.palette.background.paper}
              border={1}
              borderColor="divider"
              borderRadius={2}
              divider={<Divider />}
              px={2}
            >
              {renderedTasks}
            </Stack>
          )}
        </SortableContext>

        <DragOverlay>{dragOverlayContent}</DragOverlay>
      </DndContext>
    </>
  )
}
