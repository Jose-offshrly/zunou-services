import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  Add,
  ChevronLeft,
  EditOutlined,
  KeyboardArrowDown,
  MoreVert,
  SettingsOutlined,
} from '@mui/icons-material'
import {
  alpha,
  Box,
  ButtonGroup,
  Chip,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import { Task } from '@zunou-graphql/core/graphql'
import { Button, IconButton } from '@zunou-react/components/form'
import { useState } from 'react'

import { ItemStatus } from '../../types/types'
import { AddItemDialog, KanbanViewType } from '.'
import KanbanCard from './Card'

interface KanbanColumnProps {
  status: ItemStatus
  statusLabel: string
  statusColor: string
  tasks: Task[]
  onItemClick: (task: Task) => void
  activeDragId: string | null
  viewType: KanbanViewType
  setAddItemDialog: (addItemDialog: AddItemDialog) => void
}

export default function KanbanColumn({
  status,
  statusLabel,
  statusColor,
  tasks,
  onItemClick,
  activeDragId,
  viewType,
  setAddItemDialog,
}: KanbanColumnProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleCollapseColumn = () => {
    setIsCollapsed(true)
    handleMenuClose()
  }

  const { setNodeRef } = useDroppable({
    data: {
      status,
      type: 'column',
    },
    id: `column-${status}`,
  })

  const taskIds = tasks.map((task) => task.id)

  return (
    <Box
      ref={setNodeRef}
      sx={{
        backgroundColor: isCollapsed ? 'grey.100' : 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        display: 'flex',
        flex: isCollapsed ? '0 0 auto' : '1 1 0',
        flexDirection: 'column',
        height: isCollapsed ? '100%' : 'fit-content',
        maxHeight: '100%',
        maxWidth: isCollapsed ? 60 : 400,
        minWidth: isCollapsed ? 60 : 300,
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
      }}
    >
      {/* Column Header */}
      {!isCollapsed && (
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          px={2}
          py={1.5}
          sx={{
            backgroundColor: alpha(statusColor, 0.4),
            borderBottom: isCollapsed ? 0 : 1,
            borderColor: 'divider',
          }}
        >
          <Stack alignItems="center" direction="row" justifyContent="start">
            <Stack alignItems="center" direction="row" spacing={1}>
              <Box
                sx={{
                  backgroundColor: statusColor,
                  borderRadius: '50%',
                  height: 8,
                  width: 8,
                }}
              />
              <Typography fontWeight={600} variant="subtitle2">
                {statusLabel}
              </Typography>
            </Stack>
            <Chip
              label={tasks.length}
              size="small"
              sx={{
                backgroundColor: 'transparent',
                color: 'text.primary',
                fontSize: '0.75rem',
                height: 24,
              }}
            />
          </Stack>

          <IconButton
            aria-controls={open ? 'column-menu' : undefined}
            aria-expanded={open ? 'true' : undefined}
            aria-haspopup="true"
            onClick={handleMenuClick}
            size="small"
          >
            <MoreVert fontSize="small" />
          </IconButton>

          <Menu
            MenuListProps={{
              'aria-labelledby': 'column-menu-button',
            }}
            anchorEl={anchorEl}
            id="column-menu"
            onClose={handleMenuClose}
            open={open && !isCollapsed}
          >
            <MenuItem
              onClick={handleCollapseColumn}
              sx={{
                gap: 1,
              }}
            >
              <KeyboardArrowDown
                sx={{
                  fontSize: 14,
                }}
              />
              <Typography variant="body2">Collapse Group</Typography>
            </MenuItem>

            <MenuItem
              disabled={true}
              sx={{
                gap: 1,
              }}
            >
              <EditOutlined
                sx={{
                  fontSize: 14,
                }}
              />
              <Typography variant="body2">Rename</Typography>
            </MenuItem>

            <MenuItem
              disabled={true}
              sx={{
                gap: 1,
              }}
            >
              <SettingsOutlined
                sx={{
                  fontSize: 14,
                }}
              />
              <Typography variant="body2">Edit Statuses</Typography>
            </MenuItem>
          </Menu>
        </Stack>
      )}

      {/* Column Content */}
      {!isCollapsed && (
        <Stack
          gap={1}
          p={1.5}
          sx={{
            '&::-webkit-scrollbar': {
              width: 8,
            },
            '&::-webkit-scrollbar-thumb': {
              '&:hover': {
                backgroundColor: alpha('#000', 0.3),
              },
              backgroundColor: alpha('#000', 0.2),
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            backgroundColor: alpha(statusColor, 0.1),
            flexGrow: 1,

            overflowY: 'auto',
          }}
        >
          {tasks.length > 0 ? (
            <SortableContext
              items={taskIds}
              strategy={verticalListSortingStrategy}
            >
              {tasks.map((task) => (
                <KanbanCard
                  isDragging={activeDragId === task.id}
                  key={task.id}
                  onClick={() => onItemClick(task)}
                  task={task}
                />
              ))}
            </SortableContext>
          ) : (
            <Box
              sx={{
                alignItems: 'center',
                border: 2,
                borderColor: 'divider',
                borderRadius: 1,
                borderStyle: 'dashed',
                display: 'flex',
                height: 100,
                justifyContent: 'center',
                p: 2,
              }}
            >
              <Typography color="text.secondary" variant="body2">
                No tasks
              </Typography>
            </Box>
          )}
        </Stack>
      )}

      {!isCollapsed && (
        <Stack width="100%">
          <ButtonGroup
            sx={{
              backgroundColor: alpha(statusColor, 0.4),
              borderColor: 'divider',
              borderRadius: 0,

              width: '100%',
            }}
          >
            <Button
              onClick={() =>
                setAddItemDialog({
                  isOpen: true,
                  ...(viewType === 'status'
                    ? { initialStatus: status }
                    : {
                        initialParentId:
                          status !== 'unassigned' ? status : null,
                      }),
                })
              }
              startIcon={<Add fontSize="small" />}
              sx={{ color: 'text.secondary', flexGrow: 1, fontSize: 'small' }}
              variant="text"
            >
              Add task
            </Button>

            {/* <Button
              startIcon={<FormatListBulletedOutlined fontSize="small" />}
              sx={{ flexGrow: 1, fontSize: 'small', color: 'text.secondary' }}
              variant="text"
            >
              Add list
            </Button> */}
          </ButtonGroup>
        </Stack>
      )}

      {/* Collapsed Content */}
      {isCollapsed && (
        <Stack
          p={1.5}
          sx={{
            alignItems: 'center',
            flexGrow: 1,
            height: '100%',
            justifyContent: 'space-between',
          }}
        >
          <Stack alignItems="center" gap={2}>
            <IconButton
              onClick={() => setIsCollapsed(!isCollapsed)}
              size="small"
              sx={{
                bgcolor: 'white',
                height: 40,
                transform: 'rotate(180deg)',
                width: 40,
              }}
            >
              <ChevronLeft fontSize="small" />
            </IconButton>

            <Box
              sx={{
                transform: 'rotate(180deg)',
                writingMode: 'vertical-rl',
              }}
            >
              <Typography fontWeight={600} variant="subtitle2">
                {statusLabel}
              </Typography>
            </Box>
          </Stack>

          <Stack
            alignItems="center"
            bgcolor="common.white"
            borderRadius="50%"
            justifyContent="center"
            sx={{
              height: 40,
              width: 40,
            }}
          >
            <Typography color="text.secondary" fontWeight={600} variant="body2">
              {tasks.length}
            </Typography>
          </Stack>
        </Stack>
      )}
    </Box>
  )
}
