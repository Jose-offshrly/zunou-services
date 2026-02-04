import { Edit } from '@mui/icons-material'
import { Avatar, Box, IconButton, Tooltip, Typography } from '@mui/material'
import { useRef, useState } from 'react'

import { TaskDetailModal } from '../../components/TaskDetailModal'
import { useTimelineStore } from '../../store/useTimelineStore'
import { TimelineItem } from '../../types/types'

interface TimelineBarProps {
  dateRange: { end: Date; start: Date }
  dayWidth: number
  item: TimelineItem
  left: number
  rowHeight: number
  showPeople: boolean
  truncateLabels: boolean
  width: number
}

export const TimelineBar = ({
  dayWidth,
  item,
  left,
  rowHeight,
  showPeople,
  truncateLabels,
  width,
}: TimelineBarProps) => {
  const resizeItem = useTimelineStore((state) => state.resizeItem)
  const selectedItems = useTimelineStore((state) => state.selectedItems)
  const setSelectedItems = useTimelineStore((state) => state.setSelectedItems)

  const [isResizing, setIsResizing] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [showEditButton, setShowEditButton] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  const isSelected = selectedItems.includes(item.id)

  const getStatusColor = () => {
    if (item.color) return item.color

    switch (item.status) {
      case 'completed':
        return '#4CAF50'
      case 'in-progress':
        return '#2196F3'
      case 'blocked':
        return '#f44336'
      case 'on-hold':
        return '#FF9800'
      default:
        return '#9E9E9E'
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on edit button or resize handle
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('[data-resize-handle]')
    ) {
      return
    }

    // Ctrl/Cmd + Click for multi-select
    if (e.ctrlKey || e.metaKey) {
      if (isSelected) {
        setSelectedItems(selectedItems.filter((id) => id !== item.id))
      } else {
        setSelectedItems([...selectedItems, item.id])
      }
    } else {
      // Single click opens edit dialog
      setSelectedItems([item.id])
      setIsEditDialogOpen(true)
    }
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsEditDialogOpen(true)
  }

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)

    const startX = e.clientX

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX
      const daysDiff = Math.round(diff / dayWidth)

      if (item.startDate && daysDiff !== 0) {
        const newEndDate = new Date(item.startDate)
        const currentDuration = item.endDate
          ? Math.ceil(
              (item.endDate.getTime() - item.startDate.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 1
        newEndDate.setDate(newEndDate.getDate() + currentDuration + daysDiff)

        if (newEndDate > item.startDate) {
          resizeItem(item.id, newEndDate)
        }
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const statusColor = getStatusColor()

  return (
    <>
      <Tooltip
        arrow={true}
        placement="top"
        title={
          <Box>
            <Typography variant="subtitle2">{item.name}</Typography>
            {item.description && (
              <Typography display="block" variant="caption">
                {item.description}
              </Typography>
            )}
            {item.owner && (
              <Typography display="block" variant="caption">
                Owner: {item.owner.name}
              </Typography>
            )}
            {item.status && (
              <Typography display="block" variant="caption">
                Status: {item.status}
              </Typography>
            )}
            {item.progress !== undefined && (
              <Typography display="block" variant="caption">
                Progress: {item.progress}%
              </Typography>
            )}
          </Box>
        }
      >
        <Box
          onClick={handleClick}
          onMouseEnter={() => setShowEditButton(true)}
          onMouseLeave={(e) => {
            // Check if mouse is moving to edit button or dialog
            const relatedTarget = e.relatedTarget as HTMLElement
            if (
              !relatedTarget ||
              (!relatedTarget.closest('button') &&
                !relatedTarget.closest('[role="dialog"]'))
            ) {
              setShowEditButton(false)
            }
          }}
          ref={barRef}
          sx={{
            alignItems: 'center',
            backgroundColor: statusColor,
            borderRadius: 1,
            boxShadow: isSelected
              ? `0 0 0 2px ${statusColor}, 0 0 0 4px white`
              : 'none',
            display: 'flex',
            gap: 0.5,
            height: rowHeight - 8,
            left,
            overflow: 'hidden',
            position: 'absolute',
            px: 1,
            top: 4,
            transition: 'box-shadow 0.2s',
            width: Math.max(width, 20),
          }}
        >
          {/* Progress bar */}
          {item.progress !== undefined && item.progress > 0 && (
            <Box
              sx={{
                backgroundColor: 'rgba(255,255,255,0.3)',
                borderRadius: 1,
                bottom: 0,
                left: 0,
                position: 'absolute',
                top: 0,
                width: `${item.progress}%`,
              }}
            />
          )}

          {/* Owner Avatar */}
          {showPeople && item.owner && (
            <Avatar
              src={item.owner.avatar}
              sx={{
                flexShrink: 0,
                fontSize: '0.7rem',
                height: 20,
                width: 20,
              }}
            >
              {item.owner.name[0]}
            </Avatar>
          )}

          {/* Label */}
          <Typography
            sx={{
              color: 'white',
              flexGrow: 1,
              fontWeight: 500,
              overflow: truncateLabels ? 'hidden' : 'visible',
              position: 'relative',
              textOverflow: truncateLabels ? 'ellipsis' : 'clip',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              whiteSpace: 'nowrap',
              zIndex: 1,
            }}
            variant="caption"
          >
            {item.name}
          </Typography>

          {/* Edit Button (shown on hover or when selected) */}
          {(showEditButton || isSelected) && (
            <IconButton
              draggable={false}
              onClick={handleEditClick}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseEnter={() => setShowEditButton(true)}
              onMouseUp={(e) => e.stopPropagation()}
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                flexShrink: 0,
                height: 20,
                pointerEvents: 'auto',
                position: 'relative',
                width: 20,
                zIndex: 10,
              }}
            >
              <Edit sx={{ fontSize: '0.75rem' }} />
            </IconButton>
          )}

          {/* Resize handle */}
          {!item.isMilestone && (
            <Box
              data-resize-handle={true}
              onMouseDown={handleResizeStart}
              sx={{
                backgroundColor: isResizing
                  ? 'rgba(255,255,255,0.5)'
                  : 'transparent',
                bottom: 0,
                cursor: 'ew-resize',
                position: 'absolute',
                right: 0,
                top: 0,
                width: 8,
              }}
            />
          )}
        </Box>
      </Tooltip>

      {/* Edit Dialog - Outside Tooltip to prevent tooltip issues */}
      <TaskDetailModal
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setShowEditButton(false)
        }}
        taskId={item.taskReference?.taskId || ''}
      />
    </>
  )
}
