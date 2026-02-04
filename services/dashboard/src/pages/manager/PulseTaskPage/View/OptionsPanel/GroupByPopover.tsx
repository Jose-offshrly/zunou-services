import { CheckOutlined } from '@mui/icons-material'
import { Button, Divider, Popover, Stack, Typography } from '@mui/material'

import { useTimelineStore } from '../../store/useTimelineStore'
import { TimelineItem } from '../../types/types'
import { GroupByField } from '../../utils/taskGrouping'

interface GroupByPopoverProps {
  anchorEl: HTMLElement | null
  onClose: () => void
  open: boolean
}

export const GroupByPopover = ({
  anchorEl,
  onClose,
  open,
}: GroupByPopoverProps) => {
  const viewConfig = useTimelineStore((state) => state.viewConfig)
  const setViewConfig = useTimelineStore((state) => state.setViewConfig)

  const currentGroupBy = viewConfig.groupBy.field as GroupByField

  const handleGroupBySelect = (field: GroupByField) => {
    setViewConfig({
      ...viewConfig,
      groupBy: {
        ...viewConfig.groupBy,
        field: (field as keyof TimelineItem) || null,
      },
    })
    onClose()
  }

  const groupByOptions: { label: string; value: GroupByField }[] = [
    { label: 'None', value: null },
    { label: 'Status', value: 'status' },
    { label: 'Priority', value: 'priority' },
    { label: 'Assignee', value: 'assignee' },
    { label: 'Due Date', value: 'dueDate' },
  ]

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{
        horizontal: 'left',
        vertical: 'top',
      }}
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '12px',
            marginLeft: -1,
            minWidth: '200px',
          },
        },
      }}
      transformOrigin={{
        horizontal: 'right',
        vertical: 'top',
      }}
    >
      <Stack spacing={1}>
        <Stack paddingTop={1.5} paddingX={2}>
          <Typography fontWeight="bold" sx={{ fontSize: '14px' }}>
            Group by
          </Typography>
        </Stack>

        <Divider />

        <Stack paddingBottom={1.5} paddingX={1.5} spacing={0.5}>
          {groupByOptions.map((option) => (
            <Button
              key={option.value ?? 'none'}
              onClick={() => handleGroupBySelect(option.value)}
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
              {currentGroupBy === option.value && (
                <CheckOutlined sx={{ color: 'primary.main', fontSize: 18 }} />
              )}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Popover>
  )
}
