import { ArrowBack, CheckOutlined, ChevronRight } from '@mui/icons-material'
import {
  Button,
  Divider,
  IconButton,
  Popover,
  Stack,
  Typography,
} from '@mui/material'
import { PulseStatusOption } from '@zunou-graphql/core/graphql'
import { useGetTaskStatusesQuery } from '@zunou-queries/core/hooks/useGetTaskStatusesQuery'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { usePulseStore } from '~/store/usePulseStore'

import { useTimelineStore } from '../../store/useTimelineStore'
import {
  SortByField,
  SortDirection,
  TaskSortConfig,
} from '../../utils/taskGrouping'

export type { SortByField, SortDirection, TaskSortConfig }

type PopoverView = 'fields' | 'direction'

interface SortByPopoverProps {
  anchorEl: HTMLElement | null
  onClose: () => void
  open: boolean
}

export const SortByPopover = ({
  anchorEl,
  onClose,
  open,
}: SortByPopoverProps) => {
  const { pulseId } = useParams<{ pulseId: string }>()
  const { pulseStatusOption } = usePulseStore()
  const viewConfig = useTimelineStore((state) => state.viewConfig)
  const setViewConfig = useTimelineStore((state) => state.setViewConfig)

  const currentSort = viewConfig.sort as TaskSortConfig | null
  const isUsingCustomStatuses = pulseStatusOption === PulseStatusOption.Custom

  // fetch custom statuses to display as options for sorting
  const { data: taskStatusesData } = useGetTaskStatusesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: isUsingCustomStatuses && open && !!pulseId,
    variables: {
      pulseId: pulseId!,
    },
  })

  const customStatuses = taskStatusesData?.taskStatuses ?? []

  // State for which view to show in the popover
  const [currentView, setCurrentView] = useState<PopoverView>('fields')
  const [selectedField, setSelectedField] = useState<SortByField>(null)

  const handleSortFieldClick = (field: SortByField) => {
    if (field === null) {
      setViewConfig({
        ...viewConfig,
        sort: null,
      })
      handleClose()
      return
    }

    setSelectedField(field)
    setCurrentView('direction')
  }

  const handleDirectionSelect = (direction: SortDirection) => {
    setViewConfig({
      ...viewConfig,
      sort: selectedField
        ? {
            direction,
            field: selectedField,
          }
        : null,
    })
    handleClose()
  }

  const handleBackToFields = () => {
    setCurrentView('fields')
    setSelectedField(null)
  }

  const handleClose = () => {
    // Reset state when closing
    setCurrentView('fields')
    setSelectedField(null)
    onClose()
  }

  const sortByOptions: { label: string; value: SortByField }[] = [
    { label: 'None', value: null },
    { label: 'Status', value: 'status' },
    { label: 'Priority', value: 'priority' },
    { label: 'Due Date', value: 'dueDate' },
  ]

  const getDirectionLabel = (
    field: SortByField,
    direction: SortDirection,
  ): string => {
    if (direction === 'asc') {
      switch (field) {
        case 'status':
          // when using custom statuses, show first → last status label if ascending
          if (isUsingCustomStatuses && customStatuses.length >= 2) {
            const sortedStatuses = [...customStatuses].sort(
              (a, b) => (a.position ?? 0) - (b.position ?? 0),
            )
            return `${sortedStatuses[0].label} → ${sortedStatuses[sortedStatuses.length - 1].label}`
          }
          return 'To Do → Completed'
        case 'priority':
          return 'No Priority → Urgent'
        case 'dueDate':
          return 'Earliest → Latest'
        default:
          return 'Ascending'
      }
    } else {
      switch (field) {
        case 'status':
          // for custom statuses, reverse the statuses order for descending option
          if (isUsingCustomStatuses && customStatuses.length >= 2) {
            const sortedStatuses = [...customStatuses].sort(
              (a, b) => (a.position ?? 0) - (b.position ?? 0),
            )
            return `${sortedStatuses[sortedStatuses.length - 1].label} → ${sortedStatuses[0].label}`
          }
          return 'Completed → To Do'
        case 'priority':
          return 'Urgent → No Priority'
        case 'dueDate':
          return 'Latest → Earliest'
        default:
          return 'Descending'
      }
    }
  }

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{
        horizontal: 'left',
        vertical: 'top',
      }}
      onClose={handleClose}
      open={open}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '12px',
            marginLeft: -1,
            minWidth: '220px',
          },
        },
      }}
      transformOrigin={{
        horizontal: 'right',
        vertical: 'top',
      }}
    >
      {currentView === 'fields' ? (
        // Field Selection View
        <Stack spacing={1}>
          <Stack paddingTop={1.5} paddingX={2}>
            <Typography fontWeight="bold" sx={{ fontSize: '14px' }}>
              Sort by
            </Typography>
          </Stack>

          <Divider />

          <Stack paddingBottom={1.5} paddingX={1.5} spacing={0.5}>
            {sortByOptions.map((option) => (
              <Button
                key={option.value ?? 'none'}
                onClick={() => handleSortFieldClick(option.value)}
                sx={{
                  ':hover': {
                    backgroundColor: 'grey.100',
                  },
                  justifyContent: 'space-between',
                  textTransform: 'none',
                }}
              >
                <Typography sx={{ color: 'text.primary', fontSize: '14px' }}>
                  {option.label}
                </Typography>
                {option.value !== null ? (
                  <ChevronRight
                    sx={{ color: 'text.secondary', fontSize: 18 }}
                  />
                ) : (
                  currentSort === null && (
                    <CheckOutlined
                      sx={{ color: 'primary.main', fontSize: 18 }}
                    />
                  )
                )}
              </Button>
            ))}
          </Stack>
        </Stack>
      ) : (
        // Direction Selection View
        <Stack spacing={1}>
          <Stack
            alignItems="center"
            direction="row"
            paddingTop={1.5}
            paddingX={1}
            spacing={0.5}
          >
            <IconButton onClick={handleBackToFields} size="small">
              <ArrowBack fontSize="small" />
            </IconButton>
            <Typography fontWeight="bold" sx={{ fontSize: '14px' }}>
              {sortByOptions.find((o) => o.value === selectedField)?.label}
            </Typography>
          </Stack>

          <Divider />

          <Stack paddingBottom={1.5} paddingX={1.5} spacing={0.5}>
            <Button
              onClick={() => handleDirectionSelect('asc')}
              sx={{
                ':hover': {
                  backgroundColor: 'grey.100',
                },
                justifyContent: 'space-between',
                textTransform: 'none',
              }}
            >
              <Typography sx={{ color: 'text.primary', fontSize: '14px' }}>
                {getDirectionLabel(selectedField, 'asc')}
              </Typography>
              {currentSort?.field === selectedField &&
                currentSort?.direction === 'asc' && (
                  <CheckOutlined sx={{ color: 'primary.main', fontSize: 18 }} />
                )}
            </Button>
            <Button
              onClick={() => handleDirectionSelect('desc')}
              sx={{
                ':hover': {
                  backgroundColor: 'grey.100',
                },
                justifyContent: 'space-between',
                textTransform: 'none',
              }}
            >
              <Typography sx={{ color: 'text.primary', fontSize: '14px' }}>
                {getDirectionLabel(selectedField, 'desc')}
              </Typography>
              {currentSort?.field === selectedField &&
                currentSort?.direction === 'desc' && (
                  <CheckOutlined sx={{ color: 'primary.main', fontSize: 18 }} />
                )}
            </Button>
          </Stack>
        </Stack>
      )}
    </Popover>
  )
}
