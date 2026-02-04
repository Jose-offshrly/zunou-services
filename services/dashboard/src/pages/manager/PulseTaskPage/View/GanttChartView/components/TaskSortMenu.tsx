import { Check, KeyboardArrowDownOutlined } from '@mui/icons-material'
import { Divider, Menu, MenuItem, Stack, Typography } from '@mui/material'
import { TaskOrder } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form'
import { useState } from 'react'

export type SortOption = 'Status' | 'Priority' | 'Assignee' | 'Due Date'

// Note: After adding new TaskOrder enum values to the schema,
// run `cd lib/zunou-graphql && make build` to regenerate types
export const SORT_OPTION_TO_ORDER: Record<SortOption, TaskOrder> = {
  Assignee: TaskOrder.AssigneeAsc,
  'Due Date': TaskOrder.DueDateAsc,
  Priority: TaskOrder.PriorityAsc,
  Status: TaskOrder.StatusAsc,
}

interface TaskSortMenuProps {
  taskCount: number
  sortBy?: SortOption
  onSortChange?: (sortBy: SortOption) => void
}

export const TaskSortMenu = ({
  taskCount,
  sortBy: controlledSortBy,
  onSortChange,
}: TaskSortMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [internalSortBy, setInternalSortBy] = useState<SortOption>('Status')
  const sortBy = controlledSortBy ?? internalSortBy
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleMenuItemClick = (option: SortOption) => {
    if (onSortChange) {
      onSortChange(option)
    } else {
      setInternalSortBy(option)
    }
    handleClose()
  }

  return (
    <Stack
      alignItems="center"
      direction="row"
      justifyContent="space-between"
      sx={{ mb: 1 }}
    >
      <Stack alignItems="center" direction="row" gap={1}>
        <Typography variant="caption">Sort by</Typography>
        <Button
          endIcon={<KeyboardArrowDownOutlined />}
          onClick={handleClick}
          size="small"
          sx={{
            color: 'text.primary',
          }}
          variant="text"
        >
          {sortBy}
        </Button>
        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{
            horizontal: 'left',
            vertical: 'bottom',
          }}
          onClose={handleClose}
          open={open}
          sx={{
            '& .MuiPaper-root': {
              minWidth: 200,
            },
          }}
          transformOrigin={{
            horizontal: 'left',
            vertical: 'top',
          }}
        >
          <Stack px={2} py={1}>
            <Typography fontWeight={600} variant="body2">
              Sort by
            </Typography>
          </Stack>
          <Divider />
          <MenuItem
            onClick={() => handleMenuItemClick('Status')}
            sx={{
              '&:hover': {
                backgroundColor:
                  sortBy === 'Status' ? 'common.lightBlue' : 'action.hover',
              },
              backgroundColor:
                sortBy === 'Status' ? 'common.lightBlue' : 'transparent',
              borderRadius: 2,
              justifyContent: 'space-between',
              mx: 1,
              px: 2,
              py: 1.5,
            }}
          >
            <Typography variant="body2">Status</Typography>
            {sortBy === 'Status' && (
              <Check sx={{ color: 'primary.main', fontSize: 20 }} />
            )}
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuItemClick('Priority')}
            sx={{
              '&:hover': {
                backgroundColor:
                  sortBy === 'Priority' ? 'common.lightBlue' : 'action.hover',
              },
              backgroundColor:
                sortBy === 'Priority' ? 'common.lightBlue' : 'transparent',
              borderRadius: 2,
              justifyContent: 'space-between',
              mx: 1,
              px: 2,
              py: 1.5,
            }}
          >
            <Typography variant="body2">Priority</Typography>
            {sortBy === 'Priority' && (
              <Check sx={{ color: 'primary.main', fontSize: 20 }} />
            )}
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuItemClick('Assignee')}
            sx={{
              '&:hover': {
                backgroundColor:
                  sortBy === 'Assignee' ? 'common.lightBlue' : 'action.hover',
              },
              backgroundColor:
                sortBy === 'Assignee' ? 'common.lightBlue' : 'transparent',
              borderRadius: 2,
              justifyContent: 'space-between',
              mx: 1,
              px: 2,
              py: 1.5,
            }}
          >
            <Typography variant="body2">Assignee</Typography>
            {sortBy === 'Assignee' && (
              <Check sx={{ color: 'primary.main', fontSize: 20 }} />
            )}
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuItemClick('Due Date')}
            sx={{
              '&:hover': {
                backgroundColor:
                  sortBy === 'Due Date' ? 'common.lightBlue' : 'action.hover',
              },
              backgroundColor:
                sortBy === 'Due Date' ? 'common.lightBlue' : 'transparent',
              borderRadius: 2,
              justifyContent: 'space-between',
              mx: 1,
              px: 2,
              py: 1.5,
            }}
          >
            <Typography variant="body2">Due Date</Typography>
            {sortBy === 'Due Date' && (
              <Check sx={{ color: 'primary.main', fontSize: 20 }} />
            )}
          </MenuItem>
        </Menu>
      </Stack>
      <Typography color="text.secondary" fontSize={12} variant="body2">
        {taskCount} Task{taskCount !== 1 ? 's' : ''}
      </Typography>
    </Stack>
  )
}
