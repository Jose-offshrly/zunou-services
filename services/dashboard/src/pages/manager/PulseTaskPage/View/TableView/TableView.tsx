import { ChevronRight, ExpandMore, Flag } from '@mui/icons-material'
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { theme } from '@zunou-react/services/Theme'
import { format } from 'date-fns'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { usePulseStore } from '~/store/usePulseStore'
import { useTaskStore } from '~/store/useTaskStore'
import { toTitleCase } from '~/utils/toTitleCase'

import { AddItemDialog } from '../../components/AddItemDialog'
import { TaskDetailModal } from '../../components/TaskDetailModal'
import {
  useFilteredItems,
  useTimelineStore,
} from '../../store/useTimelineStore'
import { ItemStatus, TaskPriority, TimelineItem } from '../../types/types'

// Status color mapping based on requirements
const getStatusColor = (status: ItemStatus | undefined): string => {
  if (!status) return '#9E9E9E' // gray for undefined

  const statusLower = status.toLowerCase()
  if (statusLower.includes('todo') || statusLower.includes('not-started')) {
    return theme.palette.text.primary
  }
  if (statusLower.includes('progress') || statusLower.includes('in-progress')) {
    return theme.palette.common.dandelion
  }
  if (statusLower.includes('review') || statusLower.includes('in-review')) {
    return '#FFC107' // yellow
  }
  if (statusLower.includes('completed')) {
    return theme.palette.common.lime
  }
  if (statusLower.includes('blocked')) {
    return '#f44336' // red
  }
  return '#9E9E9E' // default gray
}

// Format status label for display
const formatStatusLabel = (status: ItemStatus | undefined): string => {
  if (!status) return 'To Do'
  const statusLower = status.toLowerCase()
  if (statusLower.includes('todo') || statusLower.includes('not-started')) {
    return 'To Do'
  }
  if (statusLower.includes('progress') || statusLower.includes('in-progress')) {
    return 'In Progress'
  }
  if (statusLower.includes('review') || statusLower.includes('in-review')) {
    return 'In Review'
  }
  if (statusLower.includes('completed')) {
    return 'Completed'
  }
  if (statusLower.includes('blocked')) {
    return 'Blocked'
  }
  return toTitleCase(status)
}

// Priority color mapping based on requirements
const getPriorityColor = (priority: TaskPriority | undefined): string => {
  if (!priority) return '#9E9E9E'

  switch (priority) {
    case 'HIGH':
    case 'URGENT':
      return '#f44336' // red
    case 'MEDIUM':
      return '#FF9800' // orange
    case 'LOW':
      return '#4CAF50' // green
    default:
      return '#9E9E9E'
  }
}

// Format priority label
const formatPriorityLabel = (priority: TaskPriority | undefined): string => {
  if (!priority) return '—'
  return toTitleCase(priority)
}

const formatDate = (date: Date | null | undefined) => {
  if (!date) return '—'
  // Check if date is valid
  if (isNaN(date.getTime())) return '—'
  return format(date, 'MMM d, yyyy')
}

// Column width configuration
interface ColumnWidths {
  taskId: number
  task: number
  status: number
  priority: number
  assignee: number
  phase: number
  dueDate: number
}

const defaultColumnWidths: ColumnWidths = {
  assignee: 150,
  dueDate: 120,
  phase: 120,
  priority: 120,
  status: 120,
  task: 250,
  taskId: 120,
}

// Helper function to organize items hierarchically
interface HierarchicalItem {
  item: TimelineItem
  isTaskList: boolean
  children: HierarchicalItem[]
  level: number
}

const organizeItemsHierarchically = (
  items: TimelineItem[],
): HierarchicalItem[] => {
  // Identify Task Lists (items with taskType === 'LIST' and no parent)
  const taskLists = items.filter(
    (item) => item.taskType === 'LIST' && !item.taskReference?.parentTaskId,
  )

  // Create a Set of Task List IDs for quick lookup
  const taskListIds = new Set<string>()
  taskLists.forEach((taskList) => {
    if (taskList.taskReference?.taskId) {
      taskListIds.add(taskList.taskReference.taskId)
    }
  })

  // Group all items (including tasks) by their parent Task List
  const itemsByParent = new Map<string, TimelineItem[]>()
  items.forEach((item) => {
    const parentTaskId = item.taskReference?.parentTaskId
    // Only group if parent is a Task List
    if (parentTaskId && taskListIds.has(parentTaskId)) {
      if (!itemsByParent.has(parentTaskId)) {
        itemsByParent.set(parentTaskId, [])
      }
      itemsByParent.get(parentTaskId)!.push(item)
    }
  })

  // Build hierarchical structure
  const result: HierarchicalItem[] = []
  const processedTaskIds = new Set<string>()

  // Add Task Lists with their children
  taskLists.forEach((taskList) => {
    const taskListId = taskList.taskReference?.taskId
    if (!taskListId) return

    processedTaskIds.add(taskListId)
    const children: HierarchicalItem[] = []
    const childItems = itemsByParent.get(taskListId) || []

    childItems.forEach((childItem) => {
      if (childItem.taskReference?.taskId) {
        processedTaskIds.add(childItem.taskReference.taskId)
      }
      children.push({
        children: [],
        isTaskList: childItem.taskType === 'LIST',
        item: childItem,
        level: 1,
      })
    })

    result.push({
      children,
      isTaskList: true,
      item: taskList,
      level: 0,
    })
  })

  // Add standalone items (items that aren't Task Lists and don't belong to a Task List)
  items.forEach((item) => {
    const itemTaskId = item.taskReference?.taskId
    if (!itemTaskId || processedTaskIds.has(itemTaskId)) {
      return // Skip if already processed
    }

    const parentTaskId = item.taskReference?.parentTaskId
    // Only add if it doesn't have a parent Task List
    if (!parentTaskId || !taskListIds.has(parentTaskId)) {
      result.push({
        children: [],
        isTaskList: item.taskType === 'LIST',
        item,
        level: 0,
      })
    }
  })

  return result
}

export const TableView = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const items = useFilteredItems()
  const selectedItems = useTimelineStore((state) => state.selectedItems)
  const { pulseId } = useParams()
  const { pulseActions, addActionToPulse } = usePulseStore()
  const { isLoadingTasks } = useTaskStore()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [columnWidths, setColumnWidths] =
    useState<ColumnWidths>(defaultColumnWidths)
  const [resizingColumn, setResizingColumn] = useState<
    keyof ColumnWidths | null
  >(null)
  const resizeStartX = useRef<number>(0)
  const resizeStartWidth = useRef<number>(0)

  // Get pulse action for expanded task list state
  const pulseAction = useMemo(
    () => pulseActions.find((pulse) => pulse.id === pulseId),
    [pulseActions, pulseId],
  )

  // Get expanded task lists from pulse store (same as ListView)
  const expandedTaskLists = useMemo(() => {
    return new Set(pulseAction?.expandedTaskList || [])
  }, [pulseAction?.expandedTaskList])

  // Organize items hierarchically
  const hierarchicalItems = organizeItemsHierarchically(items)

  const toggleTaskList = useCallback(
    (taskListId: string) => {
      if (!pulseId) return

      const currentList = pulseAction?.expandedTaskList || []
      const isExpanded = currentList.includes(taskListId)

      if (isExpanded) {
        // Collapse: remove from expanded list
        addActionToPulse({
          id: pulseId,
          updates: {
            expandedTaskList: currentList.filter((id) => id !== taskListId),
          },
        })
      } else {
        // Expand: add to expanded list
        addActionToPulse({
          id: pulseId,
          updates: {
            expandedTaskList: [...currentList, taskListId],
          },
        })
      }
    },
    [pulseId, pulseAction?.expandedTaskList, addActionToPulse],
  )

  const handleRowClick = (item: TimelineItem, e?: React.MouseEvent) => {
    // Don't open modal if clicking on the expand/collapse control
    if (e && (e.target as HTMLElement).closest('.task-list-toggle')) {
      return
    }
    setSelectedItem(item)
    setIsDetailModalOpen(true)
  }

  const handleTaskListToggle = useCallback(
    (taskListId: string, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      toggleTaskList(taskListId)
    },
    [toggleTaskList],
  )

  const handleResizeStart = useCallback(
    (column: keyof ColumnWidths, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setResizingColumn(column)
      resizeStartX.current = e.clientX
      resizeStartWidth.current = columnWidths[column]
    },
    [columnWidths],
  )

  useEffect(() => {
    const handleResize = (e: MouseEvent) => {
      if (!resizingColumn) return

      const deltaX = e.clientX - resizeStartX.current
      const newWidth = Math.max(80, resizeStartWidth.current + deltaX)

      setColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: newWidth,
      }))
    }

    const handleResizeEnd = () => {
      setResizingColumn(null)
    }

    if (resizingColumn) {
      document.addEventListener('mousemove', handleResize)
      document.addEventListener('mouseup', handleResizeEnd)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', handleResizeEnd)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [resizingColumn])

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedItem(null)
  }

  // Responsive: Show fewer columns on mobile
  const renderTableCell = (
    content: React.ReactNode,
    column: keyof ColumnWidths,
  ) => {
    if (isMobile && (column === 'phase' || column === 'priority')) {
      return null
    }
    return content
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Table */}
      <TableContainer
        sx={{
          '&::-webkit-scrollbar': {
            height: 8,
            width: 8,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: 4,
          },
          flexGrow: 1,
          overflow: 'auto',
        }}
      >
        <Table
          aria-label="Task table"
          size="small"
          stickyHeader={true}
          sx={{
            '& .MuiTableCell-root': {
              borderBottom: '1px solid',
              borderColor: 'divider',
              px: 2,
              py: 1.5,
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              backgroundColor: 'background.paper',
              fontWeight: 600,
            },
            '& .MuiTableRow-root.Mui-selected': {
              backgroundColor: 'action.selected',
            },
            '& .MuiTableRow-root:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <TableHead>
            <TableRow>
              {/* Item No. Column - Not resizable */}
              <TableCell
                sx={{
                  minWidth: 60,
                  width: 60,
                }}
              >
                #
              </TableCell>
              {/* Task Number Column - Resizable */}
              <TableCell
                onMouseDown={(e) => handleResizeStart('taskId', e)}
                sx={{
                  cursor:
                    resizingColumn === 'taskId' ? 'col-resize' : 'default',
                  minWidth: columnWidths.taskId,
                  position: 'relative',
                  width: columnWidths.taskId,
                  ...(resizingColumn === 'taskId' && {
                    '&::after': {
                      backgroundColor: 'primary.main',
                      content: '""',
                      cursor: 'col-resize',
                      height: '100%',
                      opacity: 1,
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      width: 2,
                    },
                  }),
                  '&:hover::after': {
                    backgroundColor: 'primary.main',
                    content: '""',
                    cursor: 'col-resize',
                    height: '100%',
                    opacity: 0.5,
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    width: 2,
                  },
                }}
              >
                Task ID
              </TableCell>
              {renderTableCell(
                <TableCell
                  onMouseDown={(e) => handleResizeStart('task', e)}
                  sx={{
                    cursor:
                      resizingColumn === 'task' ? 'col-resize' : 'default',
                    minWidth: columnWidths.task,
                    position: 'relative',
                    width: columnWidths.task,
                    ...(resizingColumn === 'task' && {
                      '&::after': {
                        backgroundColor: 'primary.main',
                        content: '""',
                        cursor: 'col-resize',
                        height: '100%',
                        opacity: 1,
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        width: 2,
                      },
                    }),
                    '&:hover::after': {
                      backgroundColor: 'primary.main',
                      content: '""',
                      cursor: 'col-resize',
                      height: '100%',
                      opacity: 0.5,
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      width: 2,
                    },
                  }}
                >
                  Task
                </TableCell>,
                'task',
              )}
              {renderTableCell(
                <TableCell
                  onMouseDown={(e) => handleResizeStart('status', e)}
                  sx={{
                    cursor:
                      resizingColumn === 'status' ? 'col-resize' : 'default',
                    minWidth: columnWidths.status,
                    position: 'relative',
                    width: columnWidths.status,
                    ...(resizingColumn === 'status' && {
                      '&::after': {
                        backgroundColor: 'primary.main',
                        content: '""',
                        cursor: 'col-resize',
                        height: '100%',
                        opacity: 1,
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        width: 2,
                      },
                    }),
                    '&:hover::after': {
                      backgroundColor: 'primary.main',
                      content: '""',
                      cursor: 'col-resize',
                      height: '100%',
                      opacity: 0.5,
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      width: 2,
                    },
                  }}
                >
                  Status
                </TableCell>,
                'status',
              )}
              {renderTableCell(
                <TableCell
                  onMouseDown={(e) => handleResizeStart('priority', e)}
                  sx={{
                    cursor:
                      resizingColumn === 'priority' ? 'col-resize' : 'default',
                    minWidth: columnWidths.priority,
                    position: 'relative',
                    width: columnWidths.priority,
                    ...(resizingColumn === 'priority' && {
                      '&::after': {
                        backgroundColor: 'primary.main',
                        content: '""',
                        cursor: 'col-resize',
                        height: '100%',
                        opacity: 1,
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        width: 2,
                      },
                    }),
                    '&:hover::after': {
                      backgroundColor: 'primary.main',
                      content: '""',
                      cursor: 'col-resize',
                      height: '100%',
                      opacity: 0.5,
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      width: 2,
                    },
                  }}
                >
                  Priority
                </TableCell>,
                'priority',
              )}
              {renderTableCell(
                <TableCell
                  onMouseDown={(e) => handleResizeStart('assignee', e)}
                  sx={{
                    cursor:
                      resizingColumn === 'assignee' ? 'col-resize' : 'default',
                    minWidth: columnWidths.assignee,
                    position: 'relative',
                    width: columnWidths.assignee,
                    ...(resizingColumn === 'assignee' && {
                      '&::after': {
                        backgroundColor: 'primary.main',
                        content: '""',
                        cursor: 'col-resize',
                        height: '100%',
                        opacity: 1,
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        width: 2,
                      },
                    }),
                    '&:hover::after': {
                      backgroundColor: 'primary.main',
                      content: '""',
                      cursor: 'col-resize',
                      height: '100%',
                      opacity: 0.5,
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      width: 2,
                    },
                  }}
                >
                  Assignee
                </TableCell>,
                'assignee',
              )}
              {renderTableCell(
                <TableCell
                  onMouseDown={(e) => handleResizeStart('phase', e)}
                  sx={{
                    cursor:
                      resizingColumn === 'phase' ? 'col-resize' : 'default',
                    minWidth: columnWidths.phase,
                    position: 'relative',
                    width: columnWidths.phase,
                    ...(resizingColumn === 'phase' && {
                      '&::after': {
                        backgroundColor: 'primary.main',
                        content: '""',
                        cursor: 'col-resize',
                        height: '100%',
                        opacity: 1,
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        width: 2,
                      },
                    }),
                    '&:hover::after': {
                      backgroundColor: 'primary.main',
                      content: '""',
                      cursor: 'col-resize',
                      height: '100%',
                      opacity: 0.5,
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      width: 2,
                    },
                  }}
                >
                  Phase
                </TableCell>,
                'phase',
              )}
              <TableCell
                onMouseDown={(e) => handleResizeStart('dueDate', e)}
                sx={{
                  cursor:
                    resizingColumn === 'dueDate' ? 'col-resize' : 'default',
                  minWidth: columnWidths.dueDate,
                  position: 'relative',
                  width: columnWidths.dueDate,
                  ...(resizingColumn === 'dueDate' && {
                    '&::after': {
                      backgroundColor: 'primary.main',
                      content: '""',
                      cursor: 'col-resize',
                      height: '100%',
                      opacity: 1,
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      width: 2,
                    },
                  }),
                  '&:hover::after': {
                    backgroundColor: 'primary.main',
                    content: '""',
                    cursor: 'col-resize',
                    height: '100%',
                    opacity: 0.5,
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    width: 2,
                  },
                }}
              >
                Due Date
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(() => {
              let rowIndex = 0
              const allRows: React.ReactNode[] = []

              hierarchicalItems.forEach((hierarchicalItem) => {
                const { item, isTaskList, children, level } = hierarchicalItem
                const taskListId = item.taskReference?.taskId
                const isExpanded = taskListId
                  ? expandedTaskLists.has(taskListId)
                  : false

                // Render Task List or standalone task
                rowIndex++
                allRows.push(
                  <TableRow
                    hover={true}
                    key={item.id}
                    onClick={(e) => handleRowClick(item, e)}
                    selected={selectedItems.includes(item.id)}
                    sx={{
                      backgroundColor: level > 0 ? 'action.hover' : undefined,
                      cursor: 'pointer',
                    }}
                  >
                    {/* Item No. Cell */}
                    <TableCell>
                      <Typography color="text.secondary" variant="body2">
                        {rowIndex}
                      </Typography>
                    </TableCell>
                    {/* Task Number Cell */}
                    <TableCell>
                      <Typography variant="body2">
                        {item.taskReference?.taskNumber || '—'}
                      </Typography>
                    </TableCell>
                    {renderTableCell(
                      <TableCell>
                        <Stack alignItems="center" direction="row" gap={0.5}>
                          {isTaskList && taskListId && (
                            <IconButton
                              className="task-list-toggle"
                              onClick={(e) =>
                                handleTaskListToggle(taskListId, e)
                              }
                              size="small"
                              sx={{
                                marginLeft: -0.5,
                                padding: 0.5,
                              }}
                            >
                              {isExpanded ? (
                                <ExpandMore fontSize="small" />
                              ) : (
                                <ChevronRight fontSize="small" />
                              )}
                            </IconButton>
                          )}
                          {!isTaskList && level > 0 && (
                            <Box sx={{ width: 24 }} />
                          )}
                          <Typography
                            sx={{
                              color:
                                level > 0 ? 'text.secondary' : 'text.primary',
                              fontWeight: isTaskList
                                ? 600
                                : level > 0
                                  ? 400
                                  : 500,
                            }}
                            variant="body2"
                          >
                            {item.name}
                          </Typography>
                        </Stack>
                      </TableCell>,
                      'task',
                    )}
                    {renderTableCell(
                      <TableCell>
                        {item.status ? (
                          <Chip
                            label={formatStatusLabel(item.status)}
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(item.status),
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              height: 24,
                            }}
                          />
                        ) : (
                          <Typography color="text.disabled" variant="body2">
                            —
                          </Typography>
                        )}
                      </TableCell>,
                      'status',
                    )}
                    {renderTableCell(
                      <TableCell>
                        {item.priority ? (
                          <Stack alignItems="center" direction="row" gap={0.5}>
                            <Flag
                              fontSize="small"
                              sx={{ color: getPriorityColor(item.priority) }}
                            />
                            <Typography
                              sx={{
                                color: getPriorityColor(item.priority),
                                opacity: level > 0 ? 0.7 : 1,
                              }}
                              variant="body2"
                            >
                              {formatPriorityLabel(item.priority)}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography color="text.disabled" variant="body2">
                            —
                          </Typography>
                        )}
                      </TableCell>,
                      'priority',
                    )}
                    {renderTableCell(
                      <TableCell>
                        {item.assignees && item.assignees.length > 0 ? (
                          <Stack alignItems="center" direction="row" gap={0.5}>
                            {item.assignees.map((assignee, index) => (
                              <Avatar
                                key={assignee.id || index}
                                src={assignee.avatar}
                                sx={{
                                  border: '2px solid',
                                  borderColor: 'background.paper',
                                  fontSize: '0.75rem',
                                  height: 28,
                                  marginLeft: index > 0 ? '-8px' : 0,
                                  opacity: level > 0 ? 0.7 : 1,
                                  width: 28,
                                }}
                              >
                                {assignee.name[0]?.toUpperCase()}
                              </Avatar>
                            ))}
                            {item.assignees.length === 1 && (
                              <Typography
                                sx={{
                                  opacity: level > 0 ? 0.7 : 1,
                                }}
                                variant="body2"
                              >
                                {item.assignees[0].name}
                              </Typography>
                            )}
                          </Stack>
                        ) : item.owner ? (
                          <Stack alignItems="center" direction="row" gap={1}>
                            <Avatar
                              src={item.owner.avatar}
                              sx={{
                                fontSize: '0.75rem',
                                height: 28,
                                opacity: level > 0 ? 0.7 : 1,
                                width: 28,
                              }}
                            >
                              {item.owner.name[0]?.toUpperCase()}
                            </Avatar>
                            <Typography
                              sx={{
                                opacity: level > 0 ? 0.7 : 1,
                              }}
                              variant="body2"
                            >
                              {item.owner.name}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography color="text.disabled" variant="body2">
                            —
                          </Typography>
                        )}
                      </TableCell>,
                      'assignee',
                    )}
                    {renderTableCell(
                      <TableCell>
                        {item.phase ? (
                          <Typography
                            sx={{
                              opacity: level > 0 ? 0.7 : 1,
                            }}
                            variant="body2"
                          >
                            {toTitleCase(item.phase)}
                          </Typography>
                        ) : (
                          <Typography color="text.disabled" variant="body2">
                            —
                          </Typography>
                        )}
                      </TableCell>,
                      'phase',
                    )}
                    <TableCell>
                      <Typography
                        sx={{
                          opacity: level > 0 ? 0.7 : 1,
                        }}
                        variant="body2"
                      >
                        {formatDate(item.endDate)}
                      </Typography>
                    </TableCell>
                  </TableRow>,
                )

                // Render child tasks if Task List is expanded
                // Check both isTaskList and that we have a valid taskListId
                if (
                  isTaskList &&
                  taskListId &&
                  expandedTaskLists.has(taskListId)
                ) {
                  // Render all child tasks when expanded
                  children.forEach((childItem) => {
                    rowIndex++
                    allRows.push(
                      <TableRow
                        hover={true}
                        key={childItem.item.id}
                        onClick={(e) => handleRowClick(childItem.item, e)}
                        selected={selectedItems.includes(childItem.item.id)}
                        sx={{
                          cursor: 'pointer',
                        }}
                      >
                        {/* Item No. Cell */}
                        <TableCell>
                          <Typography color="text.secondary" variant="body2">
                            {rowIndex}
                          </Typography>
                        </TableCell>
                        {/* Task Number Cell */}
                        <TableCell>
                          <Typography variant="body2">
                            {childItem.item.taskReference?.taskNumber || '—'}
                          </Typography>
                        </TableCell>
                        {renderTableCell(
                          <TableCell>
                            <Stack
                              alignItems="center"
                              direction="row"
                              gap={0.5}
                            >
                              <Box sx={{ width: 24 }} />
                              <Typography
                                sx={{
                                  color: 'text.secondary',
                                  fontWeight: 400,
                                }}
                                variant="body2"
                              >
                                {childItem.item.name}
                              </Typography>
                            </Stack>
                          </TableCell>,
                          'task',
                        )}
                        {renderTableCell(
                          <TableCell>
                            {childItem.item.status ? (
                              <Chip
                                label={formatStatusLabel(childItem.item.status)}
                                size="small"
                                sx={{
                                  backgroundColor: getStatusColor(
                                    childItem.item.status,
                                  ),
                                  color: 'white',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  height: 24,
                                }}
                              />
                            ) : (
                              <Typography color="text.disabled" variant="body2">
                                —
                              </Typography>
                            )}
                          </TableCell>,
                          'status',
                        )}
                        {renderTableCell(
                          <TableCell>
                            {childItem.item.priority ? (
                              <Stack
                                alignItems="center"
                                direction="row"
                                gap={0.5}
                              >
                                <Flag
                                  fontSize="small"
                                  sx={{
                                    color: getPriorityColor(
                                      childItem.item.priority,
                                    ),
                                  }}
                                />
                                <Typography
                                  sx={{
                                    color: getPriorityColor(
                                      childItem.item.priority,
                                    ),
                                    opacity: 0.7,
                                  }}
                                  variant="body2"
                                >
                                  {formatPriorityLabel(childItem.item.priority)}
                                </Typography>
                              </Stack>
                            ) : (
                              <Typography color="text.disabled" variant="body2">
                                —
                              </Typography>
                            )}
                          </TableCell>,
                          'priority',
                        )}
                        {renderTableCell(
                          <TableCell>
                            {childItem.item.assignees &&
                            childItem.item.assignees.length > 0 ? (
                              <Stack
                                alignItems="center"
                                direction="row"
                                gap={0.5}
                              >
                                {childItem.item.assignees.map(
                                  (assignee, index) => (
                                    <Avatar
                                      key={assignee.id || index}
                                      src={assignee.avatar}
                                      sx={{
                                        border: '2px solid',
                                        borderColor: 'background.paper',
                                        fontSize: '0.75rem',
                                        height: 28,
                                        marginLeft: index > 0 ? '-8px' : 0,
                                        opacity: 0.7,
                                        width: 28,
                                      }}
                                    >
                                      {assignee.name[0]?.toUpperCase()}
                                    </Avatar>
                                  ),
                                )}
                                {childItem.item.assignees.length === 1 && (
                                  <Typography
                                    sx={{ opacity: 0.7 }}
                                    variant="body2"
                                  >
                                    {childItem.item.assignees[0].name}
                                  </Typography>
                                )}
                              </Stack>
                            ) : childItem.item.owner ? (
                              <Stack
                                alignItems="center"
                                direction="row"
                                gap={1}
                              >
                                <Avatar
                                  src={childItem.item.owner.avatar}
                                  sx={{
                                    fontSize: '0.75rem',
                                    height: 28,
                                    opacity: 0.7,
                                    width: 28,
                                  }}
                                >
                                  {childItem.item.owner.name[0]?.toUpperCase()}
                                </Avatar>
                                <Typography
                                  sx={{ opacity: 0.7 }}
                                  variant="body2"
                                >
                                  {childItem.item.owner.name}
                                </Typography>
                              </Stack>
                            ) : (
                              <Typography color="text.disabled" variant="body2">
                                —
                              </Typography>
                            )}
                          </TableCell>,
                          'assignee',
                        )}
                        {renderTableCell(
                          <TableCell>
                            {childItem.item.phase ? (
                              <Typography sx={{ opacity: 0.7 }} variant="body2">
                                {toTitleCase(childItem.item.phase)}
                              </Typography>
                            ) : (
                              <Typography color="text.disabled" variant="body2">
                                —
                              </Typography>
                            )}
                          </TableCell>,
                          'phase',
                        )}
                        <TableCell>
                          <Typography sx={{ opacity: 0.7 }} variant="body2">
                            {formatDate(childItem.item.endDate)}
                          </Typography>
                        </TableCell>
                      </TableRow>,
                    )
                  })
                }
              })

              return allRows
            })()}

            {/* Loading state */}
            {isLoadingTasks && items.length === 0 && (
              <TableRow>
                <TableCell align="center" colSpan={8} sx={{ py: 4 }}>
                  <Stack alignItems="center" justifyContent="center">
                    <LoadingSpinner />
                  </Stack>
                </TableCell>
              </TableRow>
            )}

            {/* Empty state */}
            {!isLoadingTasks && items.length === 0 && (
              <TableRow>
                <TableCell align="center" colSpan={8} sx={{ py: 4 }}>
                  <Typography color="text.secondary" gutterBottom={true}>
                    No items to display
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Task Detail Modal */}
      {selectedItem?.taskReference?.taskId && (
        <TaskDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          taskId={selectedItem.taskReference.taskId}
        />
      )}

      {/* Add Item Dialog */}
      <AddItemDialog
        onClose={() => setIsAddDialogOpen(false)}
        open={isAddDialogOpen}
      />
    </Box>
  )
}
