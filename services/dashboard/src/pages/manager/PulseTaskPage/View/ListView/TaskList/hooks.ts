import {
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import {
  PulseCategory,
  TaskStatus,
  TaskType,
} from '@zunou-graphql/core/graphql'
import { useGetTasksQuery } from '@zunou-queries/core/hooks/useGetTasksQuery'
import { useUpdateTaskOrderMutation } from '@zunou-queries/core/hooks/useUpdateTaskOrderMutation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'
import { useAuthContext } from 'zunou-react/contexts/AuthContext'

import { useOrganization } from '~/hooks/useOrganization'
import { usePulseStore } from '~/store/usePulseStore'
import { useTaskStore } from '~/store/useTaskStore'
import {
  findNearestParentList,
  flattenTree,
  getLastChildIndex,
  isLastChild,
  moveChildrenAfterParent,
  Node,
  reorganizeChildrenBelowParents,
} from '~/utils/taskDragAndDropUtils'

enum ItemLocation {
  Left = 'LEFT',
  Default = 'DEFAULT',
  Right = 'Right',
}

const DEBUG_MODE = true

export const useHooks = () => {
  const { pulse, pulseActions, addActionToPulse } = usePulseStore()
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const { user } = useAuthContext()
  const {
    filters: taskFilters,
    setUpdatingTaskOrder,
    isUpdatingTaskOrder,
  } = useTaskStore()
  const isPersonalPulse = pulse?.category === PulseCategory.Personal

  const pulseAction = useMemo(
    () => pulseActions.find((pulse) => pulse.id === pulseId),
    [pulseActions, pulseId],
  )

  // Tracker of dragging item position horizontally relative to original position
  const [activeItemLocation, setActiveItemLocation] = useState<ItemLocation>(
    ItemLocation.Default,
  )

  const [activeId, setActiveId] = useState<string | null>(null)

  const [rootTasks, setRootTasks] = useState<Node[]>([])

  const { mutateAsync: updateTaskOrder } = useUpdateTaskOrderMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  // shows tasks from all pulses when user is inside Personal Pulse
  const { data: tasksData } = useGetTasksQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      ...taskFilters,
      ...(isPersonalPulse && !taskFilters.isPersonalTasks
        ? { entityId: taskFilters.entityId || undefined, userId: user?.id } // show personal tasks including filters if available
        : { entityId: pulseId }),
    }, // Disable query when using dummy data
  })

  // Use store tasks when using dummy data, otherwise use query results
  const pulseTasks = tasksData?.tasks ?? []

  const filteredTasks = useMemo(() => {
    let tasks = pulseTasks

    // Filter by custom status ID (is filter)
    if (taskFilters.taskStatusId) {
      tasks = tasks.filter((task) => {
        if (task.type !== TaskType.List) {
          return task.task_status_id === taskFilters.taskStatusId
        }
        // for task lists, include if it has at least one child that matches the status
        const hasMatchingChild = task.children?.some(
          (child) => child.task_status_id === taskFilters.taskStatusId,
        )
        return (
          task.task_status_id === taskFilters.taskStatusId || hasMatchingChild
        )
      })
    }

    // Filter by excluded custom status ID (is not filter)
    if (taskFilters.excludeTaskStatusId) {
      tasks = tasks.filter((task) => {
        if (task.type !== TaskType.List) {
          return task.task_status_id !== taskFilters.excludeTaskStatusId
        }
        // for task lists, include if it has at least one child that doesn't match the excluded status
        const hasIncludedChild = task.children?.some(
          (child) => child.task_status_id !== taskFilters.excludeTaskStatusId,
        )
        return task.children?.length === 0 || hasIncludedChild
      })
    }

    if (taskFilters.showCompletedTasks) {
      return tasks
    }
    // When showCompletedTasks is toggled off, exclude completed tasks from the list
    const nonCompletedTasks = tasks
      .filter((task) => task.status !== TaskStatus.Completed)
      .filter((task) => {
        if (task.type !== TaskType.List) return true

        // show task list only if it has at least one non-completed child task
        const hasNonCompletedChild = task.children?.some(
          (child) => child.status !== TaskStatus.Completed,
        )
        return task.children?.length === 0 || hasNonCompletedChild
      })

    // when excluding a priority, make sure to also exclude tasks inside a list
    if (taskFilters.excludePriority) {
      return nonCompletedTasks.filter((task) => {
        if (task.type !== TaskType.List) {
          return task.priority !== taskFilters.excludePriority
        }

        // for task lists, include if it has at least one child that doesn't match the excluded priority
        const hasIncludedChild = task.children?.some(
          (child) => child.priority !== taskFilters.excludePriority,
        )
        return task.children?.length === 0 || hasIncludedChild
      })
    }

    return nonCompletedTasks
  }, [
    pulseTasks,
    taskFilters.showCompletedTasks,
    taskFilters.taskStatusId,
    taskFilters.excludeTaskStatusId,
    taskFilters.excludePriority,
  ])

  useEffect(() => {
    const root = filteredTasks.filter((task) => task.parent === null)
    const flatArray = flattenTree(root, pulseAction?.expandedTaskList || [])
    setRootTasks(flatArray)
  }, [filteredTasks, pulseAction?.expandedTaskList, pulseAction])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1, // Minimum distance before activation
      },
    }),
  )

  const submit = useCallback(async (tasks: Node[], msg?: string) => {
    await updateTaskOrder(
      tasks.map((task, index) => ({
        order: String(index + 1),
        organizationId,
        parentId: task.parent?.id ?? null,
        taskId: task.id,
      })),
      {
        onError: () => toast.error('Error updating task order.'),
        onSuccess: () => {
          toast.success(msg || 'Tasks updated!')
        },
      },
    )
  }, [])

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      if (event.delta.x <= -50) {
        setActiveItemLocation(ItemLocation.Left)
      } else if (event.delta.x >= 50) {
        setActiveItemLocation(ItemLocation.Right)
      } else {
        setActiveItemLocation(ItemLocation.Default)
      }
    },
    [setActiveItemLocation],
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event

      setActiveId(active.id as string)

      const activeNode = rootTasks.find(
        (task) => task.id === (active.id as string),
      )

      if (activeNode?.type === TaskType.Task) return

      setRootTasks((prev) =>
        prev.map((task) => {
          if (task.id === (active.id as string)) {
            return { ...task, isExpanded: false }
          }

          return task
        }),
      )
    },
    [setActiveId, setRootTasks, rootTasks],
  )

  const findNodeIndex = useCallback(
    (id: string) => rootTasks.findIndex((task) => task.id === id),
    [rootTasks],
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event

      setActiveId(null) // Clear the active ID

      /**
       *  Resorting were applied.
       */
      if (over && active.id !== over.id) {
        // Find the indices of the dragged and target tasks
        const oldIndex = rootTasks.findIndex((task) => task.id === active.id)
        const newIndex = rootTasks.findIndex((task) => task.id === over.id)

        if (oldIndex !== -1 && newIndex !== -1) {
          // APPLY SORTING ORDER

          // Create a temporary container for the reordered tasks
          const tempOrderedTasks = arrayMove(rootTasks, oldIndex, newIndex)

          // Create a container for the original reordered tasks without hierarchy changes
          let newOrderedTasks: Node[] = []

          const type = active?.data.current?.type as TaskType
          /**
           *
           *  If dragging a task list(which will be automatically collapsed because of handleDragStart)
           *  grab all its children and place it to new index of task list
           */
          if (type && type == TaskType.List) {
            if (DEBUG_MODE) console.log('[DEBUG]: Path -1')

            newOrderedTasks = moveChildrenAfterParent(
              tempOrderedTasks,
              active.id as string,
            )
          } else {
            if (DEBUG_MODE) console.log('[DEBUG]: Path 0')
            newOrderedTasks = tempOrderedTasks
          }

          // Variables used to help determine hierarchy changes
          const activeNodeIndex = newOrderedTasks.findIndex(
            (task) => task.id === active.id,
          )
          const prevNode = newOrderedTasks[activeNodeIndex - 1]
          const activeNode = newOrderedTasks[activeNodeIndex]
          const nextNode = newOrderedTasks[activeNodeIndex + 1]

          // Grab the nearest list north
          const nearestParent = findNearestParentList(
            newOrderedTasks,
            active.id as string,
          )

          // Store updated tasks hierarchy
          let transformedTasks: Node[] | null = null

          // === PATCH: Only allow dropping into a list if it is expanded ===
          // Helper to determine if we can assign a parent
          const canAssignToNearestParent =
            nearestParent && nearestParent.isExpanded

          // APPLY HIERARCHY CHANGES (EX. DRAGGING A ROOT TASK TO INSIDE A TASK LIST)
          if (
            /**
             *  Initial: Inside Task List (Not last child)
             *  Destination: Root Level
             *  Condition: Drag a task from inside a task list but not a
             *  last child outside and previous node is a child of another
             *  task list and dragging in default
             */
            activeNode.parent &&
            nearestParent?.id !== activeNode.parent.id &&
            prevNode?.parent &&
            nextNode?.parent &&
            nextNode?.parent.id === prevNode?.parent.id &&
            activeItemLocation === ItemLocation.Left
          ) {
            if (DEBUG_MODE) console.log('[DEBUG]: Path 1')

            transformedTasks = newOrderedTasks.map((task) => {
              if (task.id !== active.id) return task

              return { ...task, parent: nearestParent }
            })
          } else if (
            /**
             *  Initial: Inside Task List
             *  Destination: Root Level
             *  Condition: Drag a task to the top of the root
             */ activeNode.parent &&
            !nearestParent &&
            !prevNode
          ) {
            if (DEBUG_MODE) console.log('[DEBUG]: Path 2')

            transformedTasks = newOrderedTasks.map((task) => {
              if (task.id !== active.id) return task

              return { ...task, parent: null }
            })
          } else if (
            /**
             *  Initial: Inside Task List
             *  Destination: Root
             *  Condition: if a child task is dragged between two nodes that has no parent or
             *  previous node has no parent and there is no next node or if prev node has a parent but we're dragging left
             */
            activeNode.parent &&
            ((!prevNode?.parent &&
              prevNode?.type === TaskType.Task &&
              !nextNode?.parent) ||
              (!prevNode?.parent &&
                prevNode?.type === TaskType.Task &&
                !nextNode) ||
              (prevNode?.parent && activeItemLocation === ItemLocation.Left) ||
              (prevNode?.type === TaskType.List &&
                activeItemLocation === ItemLocation.Left))
          ) {
            if (DEBUG_MODE) console.log('[DEBUG]: Path 3')
            transformedTasks = newOrderedTasks.map((task) => {
              if (task.id !== active.id) return task

              return { ...task, parent: null }
            })
          } else if (
            /**
             *  Initial: Inside Task List / Root Level
             *  Destination: Task List
             *  Condition: Drag a task between two siblings or between a parent and a child,
             *  regardless of x position make the nearest parent the parent of the active node
             */
            nearestParent &&
            activeNode.type === TaskType.Task &&
            prevNode.parent &&
            nextNode.parent &&
            (prevNode?.parent?.id === nextNode?.parent?.id ||
              prevNode?.id === nextNode?.parent?.id)
          ) {
            if (DEBUG_MODE) console.log('[DEBUG]: Path 4')

            transformedTasks = newOrderedTasks.map((task) => {
              if (task.id !== activeNode.id) return task
              // Only assign as child if list is expanded
              return {
                ...task,
                parent: canAssignToNearestParent ? nearestParent : null,
              }
            })
          } else if (
            /**
             *  Initial: Inside Task List
             *  Destination: Root Level
             *  Condition: Drag a task that is last child from
             *  inside a task list to root level
             */
            activeItemLocation === ItemLocation.Left &&
            activeNode?.parent &&
            activeNode.type === TaskType.Task &&
            (isLastChild(newOrderedTasks, active.id as string) ||
              isLastChild(newOrderedTasks, over.id as string)) //Only if active is last child or before it is
          ) {
            if (DEBUG_MODE) console.log('[DEBUG]: Path 5')

            transformedTasks = newOrderedTasks.map((task) => {
              if (task.id !== activeNode.id) return task

              return { ...task, parent: null }
            })
          } else if (
            /**
             *  Initial: Inside Task List (Not last child)
             *  Destination: Root Level
             *  Condition: Drag a task from inside a task list but not a
             *  last child outside towards -y and previous node is a child of another
             *  task list and dragging in default
             */
            activeNode.parent &&
            nearestParent?.id !== activeNode.parent.id &&
            prevNode.parent &&
            prevNode.parent.id === nearestParent?.id &&
            (activeItemLocation === ItemLocation.Default ||
              activeItemLocation === ItemLocation.Right)
          ) {
            if (DEBUG_MODE) console.log('[DEBUG]: Path 6')

            transformedTasks = newOrderedTasks.map((task) => {
              if (task.id !== active.id) return task

              return { ...task, parent: nearestParent }
            })
          } else if (
            /**
             *  Initial: Inside Task List (Not last child)
             *  Destination: Root Level
             *  Condition: Drag a task from inside a task list but not a
             *  last child outside and previous node is a child of another
             *  task list and dragging in default or right
             */
            activeNode.parent &&
            nearestParent?.id !== activeNode.parent.id &&
            prevNode.type === TaskType.List &&
            (activeItemLocation === ItemLocation.Default ||
              activeItemLocation === ItemLocation.Right)
          ) {
            if (DEBUG_MODE) console.log('[DEBUG]: Path 7')

            transformedTasks = newOrderedTasks.map((task) => {
              if (task.id !== active.id) return task

              return { ...task, parent: nearestParent }
            })
          } else if (
            /**
             *  Initial: Inside Task List
             *  Destination: Root Level
             *  Condition: Drag a task from inside a task list to root level but towards y axis
             */
            activeNode.type === TaskType.Task &&
            activeNode?.parent &&
            activeNode.parent.id !== nearestParent?.id &&
            activeItemLocation === ItemLocation.Left
          ) {
            if (DEBUG_MODE) console.log('[DEBUG]: Path 8')

            transformedTasks = newOrderedTasks.map((task) => {
              if (task.id !== activeNode.id) return task

              return { ...task, parent: null }
            })
          } else if (
            /**
             *  Initial: Root Level
             *  Destination: Root Level
             *  Condition: Drag a task or task list in root level after a collapsed tasklist
             *  while maintaining DEFAULT position in activeItemLocation.
             */
            !activeNode.parent &&
            nearestParent &&
            nearestParent.id === over.id &&
            !nearestParent.isExpanded &&
            activeItemLocation === ItemLocation.Default
          ) {
            if (DEBUG_MODE) console.log('[DEBUG]: Path 9')

            const lastChildIndex = getLastChildIndex(
              newOrderedTasks,
              nearestParent.id,
            )
            const oldIndex = newOrderedTasks.findIndex(
              (task) => task.id === activeNode.id,
            )

            let newIndex
            if (lastChildIndex === null || lastChildIndex === undefined) {
              // No children - place right after parent
              const parentIndex = newOrderedTasks.findIndex(
                (task) => task.id === nearestParent.id,
              )
              newIndex = oldIndex < parentIndex ? parentIndex : parentIndex + 1
            } else {
              // Has children - place after last child
              newIndex =
                oldIndex < lastChildIndex ? lastChildIndex : lastChildIndex + 1
            }

            transformedTasks = arrayMove(newOrderedTasks, oldIndex, newIndex)
          } else if (
            /**
             *  Initial: Root Level
             *  Destination: Inside Task List
             *  Condition: Drag a task in root level after a collapsed tasklist
             *  while moving right
             */
            !activeNode.parent &&
            nearestParent &&
            nearestParent.id === over.id &&
            !nearestParent.isExpanded &&
            activeItemLocation === ItemLocation.Right &&
            activeNode.type !== TaskType.List
          ) {
            if (DEBUG_MODE) console.log('[DEBUG]: Path 10')

            const lastChildIndex = getLastChildIndex(
              newOrderedTasks,
              nearestParent.id,
            )
            const oldIndex = newOrderedTasks.findIndex(
              (task) => task.id === activeNode.id,
            )

            let newIndex
            if (lastChildIndex === null || lastChildIndex === undefined) {
              // No children - place right after parent
              const parentIndex = newOrderedTasks.findIndex(
                (task) => task.id === nearestParent.id,
              )
              newIndex = oldIndex < parentIndex ? parentIndex : parentIndex + 1
            } else {
              // Has children - place after last child
              newIndex =
                oldIndex < lastChildIndex ? lastChildIndex : lastChildIndex + 1
            }

            const reorderedTasks = arrayMove(
              newOrderedTasks,
              oldIndex,
              newIndex,
            )

            transformedTasks = reorderedTasks.map((task) => {
              if (task.id !== activeNode.id) return task
              // Only assign as child if list is expanded
              return {
                ...task,
                parent: canAssignToNearestParent ? nearestParent : null,
              }
            })
          } else if (
            /**
             *  Initial: Root Level
             *  Destination: Inside Task List
             *  Condition: Drag a task in root level after a expanded tasklist
             *  while moving right
             */
            !activeNode.parent &&
            nearestParent &&
            nearestParent.id === over.id &&
            nearestParent.isExpanded &&
            activeItemLocation === ItemLocation.Right &&
            activeNode.type !== TaskType.List
          ) {
            if (DEBUG_MODE) console.log('[DEBUG]: Path 11')

            transformedTasks = newOrderedTasks.map((task) => {
              if (task.id !== activeNode.id) return task
              // Only assign as child if list is expanded
              return {
                ...task,
                parent: canAssignToNearestParent ? nearestParent : null,
              }
            })
          } else if (
            /**
             *  Initial: Root Level
             *  Destination: Inside Expanded Task List
             *  Condition: Drag a task from root level to an expanded task list
             */
            nearestParent &&
            nextNode &&
            nextNode.parent &&
            nextNode.parent.id === nearestParent.id &&
            activeNode.type === TaskType.Task &&
            activeItemLocation === ItemLocation.Right
          ) {
            if (DEBUG_MODE) console.log('[DEBUG]: Path 12')

            const transfered = newOrderedTasks.map((task) => {
              if (task.id !== activeNode.id) return task
              // Only assign as child if list is expanded
              return {
                ...task,
                parent: canAssignToNearestParent ? nearestParent : null,
              }
            })

            transformedTasks = transfered
          } else if (
            /**
             *  Initial: Root Level
             *  Destination: Root Level
             *  Condition: Drag a task list from root to below a collapsed task list towards right
             */
            activeNode.type === TaskType.List &&
            activeNode.parent &&
            nearestParent?.id === activeNode.parent.id &&
            !prevNode.parent &&
            activeItemLocation === ItemLocation.Default
          ) {
            if (DEBUG_MODE) console.log('[DEBUG]: Path 13')

            transformedTasks = newOrderedTasks.map((task) => {
              if (task.id !== active.id) return task

              return { ...task, parent: null }
            })
          } else if (
            activeNode.type === TaskType.List &&
            ((prevNode?.parent && prevNode?.parent?.id === nearestParent?.id) ||
              prevNode?.type === TaskType.List) &&
            activeItemLocation === ItemLocation.Right
          ) {
            toast.error('Lists cannot be nested within other lists.')

            setRootTasks(reorganizeChildrenBelowParents(rootTasks))

            return
          } else if (
            /**
             *  Initial: Root Level
             *  Destination: Inside Task List
             *  Condition: Drag a task from root to inside a
             *  expanded task list towards right, after its last child
             */
            activeNode.type === TaskType.Task &&
            !activeNode.parent &&
            prevNode?.parent &&
            nearestParent?.id === prevNode?.parent.id &&
            prevNode.type === TaskType.Task &&
            activeItemLocation === ItemLocation.Right
          ) {
            if (DEBUG_MODE) console.log('[DEBUG]: Path 14')

            transformedTasks = newOrderedTasks.map((task) => {
              if (task.id !== active.id) return task

              return { ...task, parent: nearestParent }
            })
          } else if (
            /**
             *  Initial: Root Level
             *  Destination: Inside Task List
             *  Condition: Drag a task from root to inside a task list with no children
             */
            activeNode.type === TaskType.Task &&
            nearestParent &&
            prevNode.parent &&
            nextNode.parent &&
            prevNode?.parent?.id === nearestParent?.id &&
            nextNode?.parent?.id === nearestParent?.id
          ) {
            if (DEBUG_MODE) console.log('[DEBUG]: Path 15')

            transformedTasks = newOrderedTasks.map((task) => {
              if (task.id !== activeNode.id) return task

              return { ...task, parent: nearestParent }
            })
          } else if (
            /**
             *  Initial: Root Level
             *  Destination: Inside Task List
             *  Condition: Drag a task from root to inside a task list with no children
             */
            activeNode.type === TaskType.Task &&
            !activeNode.parent &&
            nearestParent &&
            prevNode &&
            (nearestParent.id === prevNode.parent?.id ||
              nearestParent.id === prevNode.id) &&
            activeItemLocation === ItemLocation.Right
          ) {
            if (DEBUG_MODE) console.log('[DEBUG]: Path 16')

            transformedTasks = newOrderedTasks.map((task) => {
              if (task.id !== activeNode.id) return task

              return { ...task, parent: nearestParent }
            })
          } else {
            /**
             *  Initial: NA
             *  Destination: NA
             *  Condition: No hierarchy changes
             */
            if (DEBUG_MODE) console.log('[DEBUG]: NO HIERARCHY CHANGES')

            transformedTasks = newOrderedTasks

            // Do not return to apply resorting changes
          }

          // Update state with the new order and structure
          setRootTasks(reorganizeChildrenBelowParents(transformedTasks))

          // Submit to new tasks order and hierarchy
          setUpdatingTaskOrder(true)

          await submit(transformedTasks)

          setUpdatingTaskOrder(false)
        }
      } else {
        /**
         *  No resorting were applied only hierarchy changes.
         */

        // Variables used to help determine hierarchy changes
        const activeNodeIndex = findNodeIndex(active.id as string)
        const activeNode = rootTasks[activeNodeIndex]
        const prevNode = rootTasks[activeNodeIndex - 1]
        // const nextNode = rootTasks[activeNodeIndex + 1]

        const nearestParent = findNearestParentList(
          rootTasks,
          active.id as string,
        )

        let transformedTasks: Node[] = []

        // Define canAssignToNearestParent for this block
        const canAssignToNearestParent =
          nearestParent && nearestParent.isExpanded
        /**
         *  Initial: Inside Task List
         *  Destination: Root Level
         *  Condition: Task has to be the last child of the parent.
         *  Drag a task inside task list (expanded or collapsed) towards left without
         *  changing order
         */
        if (
          activeNode?.parent &&
          isLastChild(rootTasks, active.id as string) &&
          activeItemLocation === ItemLocation.Left &&
          activeNode.type === TaskType.Task
        ) {
          if (DEBUG_MODE) console.log('[DEBUG]: Path 17')

          const targetIndex = rootTasks.findIndex(
            (task) => task.id === active.id,
          )

          const newRoot = rootTasks.map((task, index) => {
            if (targetIndex !== index) return task

            return { ...task, parent: null }
          })

          transformedTasks = newRoot
        } else if (
          /**
           *  Initial: Root Level
           *  Destination: Inside Task List
           *  Condition: No reordering occured simply drag the task at root
           *  level towards right and prevNode's parent is the nearestParent
           */
          !activeNode?.parent &&
          activeItemLocation === ItemLocation.Right &&
          activeNode.type === TaskType.Task &&
          prevNode &&
          nearestParent &&
          nearestParent.id === prevNode.parent?.id
        ) {
          if (DEBUG_MODE) console.log('[DEBUG]: Path 18')

          const newRoot = rootTasks.map((task) => {
            if (task.id !== activeNode.id) return task

            return { ...task, parent: nearestParent }
          })

          transformedTasks = newRoot
        } else if (
          /**
           *  Initial: Root Level
           *  Destination: Inside Task List
           *  Condition: No reordering occured simply drag the task at root
           *  level towards right and prevNode is a list
           */
          activeNode.type === TaskType.Task &&
          !activeNode.parent &&
          prevNode.type === TaskType.List &&
          activeItemLocation === ItemLocation.Right
        ) {
          if (DEBUG_MODE) console.log('[DEBUG]: Path 19')

          const newRoot = rootTasks.map((task) => {
            if (task.id !== activeNode.id) return task
            // Only assign as child if list is expanded
            return {
              ...task,
              parent: canAssignToNearestParent ? nearestParent : null,
            }
          })

          transformedTasks = newRoot
        } else {
          if (DEBUG_MODE)
            console.log('[DEBUG]: NO SORTING OR HIERARCHY CHANGES')

          transformedTasks = rootTasks

          return
        }

        setRootTasks(transformedTasks)

        setUpdatingTaskOrder(true)

        await submit(transformedTasks)

        setUpdatingTaskOrder(false)
      }

      // Reset location tracker
      setActiveItemLocation(ItemLocation.Default)
    },
    [rootTasks, submit, activeItemLocation],
  )

  const activeTask = useMemo(
    () => rootTasks.find((task) => task?.id === activeId) ?? null,
    [rootTasks, activeId],
  )

  const expandList = useCallback(
    (id: string) => {
      if (!pulseId) return

      const currentList = pulseAction?.expandedTaskList || []
      if (!currentList.includes(id)) {
        addActionToPulse({
          id: pulseId,
          updates: {
            expandedTaskList: [...currentList, id],
          },
        })
      }

      // Update local rootTasks state immediately for UI responsiveness
      setRootTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, isExpanded: true } : task,
        ),
      )
    },
    [pulseId, pulseAction?.expandedTaskList, addActionToPulse],
  )

  const collapseList = useCallback(
    (id: string) => {
      if (!pulseId) return

      const currentList = pulseAction?.expandedTaskList || []
      if (currentList.includes(id)) {
        addActionToPulse({
          id: pulseId,
          updates: {
            expandedTaskList: currentList.filter(
              (expandedId) => expandedId !== id,
            ),
          },
        })
      }

      // Update local rootTasks state immediately for UI responsiveness
      setRootTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, isExpanded: false } : task,
        ),
      )
    },
    [pulseId, pulseAction?.expandedTaskList, addActionToPulse],
  )

  const expandedStates = useMemo(() => {
    const globalExpanded = pulseAction?.expandedTaskList || []
    return rootTasks.reduce<Record<string, boolean>>((acc, task) => {
      acc[task.id] = globalExpanded.includes(task.id)
      return acc
    }, {})
  }, [rootTasks, pulseAction?.expandedTaskList])

  const isListExpanded = useCallback(
    (id: string): boolean => expandedStates[id] ?? false,
    [expandedStates],
  )

  const sortableItems = useMemo(
    () => rootTasks.map((task) => task.id),
    [rootTasks],
  )

  return {
    activeTask,
    collapseList,
    expandList,
    expandedStates,
    handleDragEnd,
    handleDragMove,
    handleDragStart,
    isListExpanded,
    isUpdatingTaskOrder,
    rootTasks,
    sensors,
    setRootTasks,
    sortableItems,
  }
}
