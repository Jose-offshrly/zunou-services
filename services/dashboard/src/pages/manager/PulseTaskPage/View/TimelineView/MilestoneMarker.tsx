import { Edit } from '@mui/icons-material'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import { format } from 'date-fns'
import { useRef, useState } from 'react'

import { TaskDetailModal } from '../../components/TaskDetailModal'
import { useTimelineStore } from '../../store/useTimelineStore'
import { TimelineItem } from '../../types/types'

interface MilestoneMarkerProps {
  dateRange: { end: Date; start: Date }
  dayWidth: number
  item: TimelineItem
  left: number
  rowHeight: number
}

export const MilestoneMarker = ({
  item,
  left,
  rowHeight,
}: MilestoneMarkerProps) => {
  const selectedItems = useTimelineStore((state) => state.selectedItems)
  const setSelectedItems = useTimelineStore((state) => state.setSelectedItems)

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [showEditButton, setShowEditButton] = useState(false)
  const markerRef = useRef<HTMLDivElement>(null)

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
      default:
        return '#9C27B0' // Default milestone color
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on edit button
    if ((e.target as HTMLElement).closest('button')) {
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

  const statusColor = getStatusColor()
  const size = rowHeight - 16

  return (
    <>
      <Tooltip
        arrow={true}
        placement="top"
        title={
          <Box>
            <Typography variant="subtitle2">{item.name}</Typography>
            {item.startDate &&
              item.startDate instanceof Date &&
              !isNaN(item.startDate.getTime()) && (
                <Typography display="block" variant="caption">
                  {format(item.startDate, 'MMM d, yyyy')}
                </Typography>
              )}
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
          ref={markerRef}
          sx={{
            '&:hover': {
              filter: 'brightness(1.1)',
              transform: 'rotate(45deg) scale(1.1)',
            },
            backgroundColor: statusColor,
            boxShadow: isSelected
              ? `0 0 0 2px ${statusColor}, 0 0 0 4px white`
              : 'none',
            cursor: 'pointer',
            height: size,
            left: left - size / 2,
            position: 'absolute',
            top: (rowHeight - size) / 2,
            transform: 'rotate(45deg)',
            transition: 'box-shadow 0.2s, transform 0.2s',
            width: size,
          }}
        >
          {/* Edit Button (shown on hover or when selected) */}
          {(showEditButton || isSelected) && (
            <IconButton
              draggable={false}
              onClick={handleEditClick}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              size="small"
              sx={{
                '& svg': {
                  fontSize: '0.6rem',
                },
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                },
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                height: 16,
                left: '50%',
                pointerEvents: 'auto',
                position: 'absolute',
                top: '50%',
                transform: 'translate(-50%, -50%) rotate(-45deg)',
                width: 16,
                zIndex: 10,
              }}
            >
              <Edit />
            </IconButton>
          )}
        </Box>
      </Tooltip>

      {/* Edit Dialog */}
      <TaskDetailModal
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        taskId={item.taskReference?.taskId || ''}
      />
    </>
  )
}
