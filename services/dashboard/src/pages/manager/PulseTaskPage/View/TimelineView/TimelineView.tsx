import { Add, ZoomIn, ZoomOut } from '@mui/icons-material'
import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import { differenceInDays, format } from 'date-fns'
import { useCallback, useMemo, useRef, useState } from 'react'

import { AddItemDialog } from '../../components/AddItemDialog'
import {
  useDateRange,
  useFilteredItems,
  useTimelineStore,
} from '../../store/useTimelineStore'
import { TimelineItem } from '../../types/types'
import { MilestoneMarker } from './MilestoneMarker'
import { TimelineBar } from './TimelineBar'
import { TimelineHeader } from './TimelineHeader'

const ROW_HEIGHT = 44
const DAY_WIDTH_BASE = 40

export const TimelineView = () => {
  const items = useFilteredItems()
  const dateRange = useDateRange()
  const displaySettings = useTimelineStore((state) => state.displaySettings)
  const zoomLevel = useTimelineStore((state) => state.zoomLevel)
  const setZoomLevel = useTimelineStore((state) => state.setZoomLevel)

  const containerRef = useRef<HTMLDivElement>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const dayWidth = DAY_WIDTH_BASE * zoomLevel

  const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1
  const totalWidth = totalDays * dayWidth

  // Calculate position for an item
  const calculateItemPosition = useCallback(
    (item: TimelineItem) => {
      if (!item.startDate) return null

      const startDays = differenceInDays(item.startDate, dateRange.start)
      const left = startDays * dayWidth

      let width = dayWidth // default for milestones

      if (item.endDate) {
        const duration = differenceInDays(item.endDate, item.startDate) + 1
        width = duration * dayWidth
      } else if (item.duration) {
        width = item.duration * dayWidth
      }

      const isMilestone = item.isMilestone || (!item.endDate && !item.duration)

      return { isMilestone, left, width }
    },
    [dateRange.start, dayWidth],
  )

  // Compute row assignments to avoid overlaps
  const computedRows = useMemo(() => {
    const rows: {
      item: TimelineItem
      row: number
      left: number
      width: number
      isMilestone: boolean
    }[] = []
    const rowEndPositions: number[] = []

    // Sort by start date
    const sortedItems = [...items].sort((a, b) => {
      if (!a.startDate) return 1
      if (!b.startDate) return -1
      return a.startDate.getTime() - b.startDate.getTime()
    })

    sortedItems.forEach((item) => {
      const position = calculateItemPosition(item)
      if (!position) return

      const { left, width, isMilestone } = position
      const itemEnd = left + width

      // Find first row where item fits
      let assignedRow = 0
      for (let i = 0; i < rowEndPositions.length; i++) {
        if (rowEndPositions[i] <= left - 5) {
          assignedRow = i
          break
        }
        assignedRow = i + 1
      }

      rowEndPositions[assignedRow] = itemEnd
      rows.push({ isMilestone, item, left, row: assignedRow, width })
    })

    return rows
  }, [items, calculateItemPosition])

  const maxRows = Math.max(...computedRows.map((r) => r.row), 0) + 1

  const handleZoomIn = () => setZoomLevel(zoomLevel + 0.25)
  const handleZoomOut = () => setZoomLevel(zoomLevel - 0.25)

  const handleAddMilestone = () => {
    setIsAddDialogOpen(true)
  }

  // Render today line
  const todayPosition = useMemo(() => {
    const today = new Date()
    if (today < dateRange.start || today > dateRange.end) return null
    return differenceInDays(today, dateRange.start) * dayWidth
  }, [dateRange, dayWidth])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <Stack
        alignItems="center"
        borderBottom={1}
        borderColor="divider"
        direction="row"
        justifyContent="space-between"
        px={2}
        py={1}
      >
        <Stack alignItems="center" direction="row" gap={1}>
          <Typography color="text.secondary" variant="body2">
            {items.length} items
          </Typography>
          <Typography color="text.secondary" variant="body2">
            •
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {format(dateRange.start, 'MMM d')} -{' '}
            {format(dateRange.end, 'MMM d, yyyy')}
          </Typography>
        </Stack>

        <Stack alignItems="center" direction="row" gap={1}>
          <IconButton
            disabled={zoomLevel <= 0.5}
            onClick={handleZoomOut}
            size="small"
          >
            <ZoomOut fontSize="small" />
          </IconButton>
          <Typography
            sx={{ minWidth: 40, textAlign: 'center' }}
            variant="caption"
          >
            {Math.round(zoomLevel * 100)}%
          </Typography>
          <IconButton
            disabled={zoomLevel >= 3}
            onClick={handleZoomIn}
            size="small"
          >
            <ZoomIn fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      {/* Timeline Content */}
      <Box
        data-timeline-container={true}
        ref={containerRef}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <Box sx={{ minWidth: totalWidth }}>
          {/* Header */}
          <TimelineHeader
            dateRange={dateRange}
            dayWidth={dayWidth}
            timeAxisScale={displaySettings.timeAxisScale}
          />

          {/* Grid and Items */}
          <Box
            sx={{
              minHeight: maxRows * ROW_HEIGHT + 100,
              position: 'relative',
            }}
          >
            {/* Grid lines */}
            <Box
              sx={{
                bottom: 0,
                left: 0,
                pointerEvents: 'none',
                position: 'absolute',
                right: 0,
                top: 0,
              }}
            >
              {Array.from({ length: totalDays }).map((_, index) => {
                const date = new Date(dateRange.start)
                date.setDate(date.getDate() + index)
                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                const dateKey = format(date, 'yyyy-MM-dd')

                return (
                  <Box
                    key={dateKey}
                    sx={{
                      backgroundColor: isWeekend
                        ? 'action.hover'
                        : 'transparent',
                      borderColor: 'divider',
                      borderRight: 1,
                      bottom: 0,
                      left: index * dayWidth,
                      opacity: 0.5,
                      position: 'absolute',
                      top: 0,
                      width: dayWidth,
                    }}
                  />
                )
              })}
            </Box>

            {/* Today line */}
            {todayPosition !== null && (
              <Box
                sx={{
                  '&::before': {
                    color: 'error.main',
                    content: '"Today"',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    left: '50%',
                    position: 'absolute',
                    top: -20,
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                  },
                  backgroundColor: 'error.main',
                  bottom: 0,
                  left: todayPosition,
                  pointerEvents: 'none',
                  position: 'absolute',
                  top: 0,
                  width: 2,
                  zIndex: 5,
                }}
              />
            )}

            {/* Row backgrounds */}
            {Array.from({ length: maxRows }).map((_, index) => (
              <Box
                key={`row-${index}`}
                sx={{
                  backgroundColor:
                    index % 2 === 0 ? 'transparent' : 'action.hover',
                  borderBottom: 1,
                  borderColor: 'divider',
                  height: ROW_HEIGHT,
                  left: 0,
                  opacity: 0.3,
                  position: 'absolute',
                  right: 0,
                  top: index * ROW_HEIGHT,
                }}
              />
            ))}

            {/* Timeline Items */}
            {computedRows.map(({ item, row, left, width, isMilestone }) => (
              <Box
                key={item.id}
                sx={{
                  height: ROW_HEIGHT,
                  left: 0,
                  position: 'absolute',
                  top: row * ROW_HEIGHT,
                  width: totalWidth,
                }}
              >
                {isMilestone ? (
                  <MilestoneMarker
                    dateRange={dateRange}
                    dayWidth={dayWidth}
                    item={item}
                    left={left}
                    rowHeight={ROW_HEIGHT}
                  />
                ) : (
                  <TimelineBar
                    dateRange={dateRange}
                    dayWidth={dayWidth}
                    item={item}
                    left={left}
                    rowHeight={ROW_HEIGHT}
                    showPeople={displaySettings.peopleColumn !== null}
                    truncateLabels={displaySettings.truncateLabels}
                    width={width}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Empty state */}
        {items.length === 0 && (
          <Box
            sx={{
              left: '50%',
              position: 'absolute',
              textAlign: 'center',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Typography color="text.secondary" gutterBottom={true}>
              No items to display
            </Typography>
            <Button
              onClick={handleAddMilestone}
              startIcon={<Add />}
              variant="outlined"
            >
              Add your first milestone
            </Button>
          </Box>
        )}
      </Box>

      {/* Add Item Dialog */}
      <AddItemDialog
        onClose={() => setIsAddDialogOpen(false)}
        open={isAddDialogOpen}
      />
    </Box>
  )
}
