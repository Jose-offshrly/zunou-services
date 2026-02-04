import {
  AddOutlined,
  EditOutlined,
  FilterAltOutlined,
  KeyboardArrowDown,
  Today,
  Tune,
} from '@mui/icons-material'
import {
  Badge,
  Button,
  Divider,
  Menu,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from '@mui/material'
import { Stack } from '@mui/system'
import {
  PulseCategory,
  TaskPriority,
  TaskStatus,
} from '@zunou-graphql/core/graphql'
import { useGetPulsesQuery } from '@zunou-queries/core/hooks/useGetPulsesQuery'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useState } from 'react'

import { SettingsTabIdentifier } from '~/components/domain/settings/SettingsModal'
import { ChipButton } from '~/components/ui/button/ChipButton'
import { useAccessControl } from '~/hooks/useAccessControl'
import { useOrganization } from '~/hooks/useOrganization'
import { usePulseStore } from '~/store/usePulseStore'
import { useUserSettingsStore } from '~/store/useUserSettingsStore'
import { PulsePermissionEnum, PulsePermissionMap } from '~/types/permissions'
import { toTitleCase } from '~/utils/toTitleCase'

import { useTimelineStore } from '../../store/useTimelineStore'
import { TaskViewSwitcher } from '../../TaskViewSwitcher'
import { taskPriorityOptions } from '../../View/ListView/CreateTaskForm/PriorityDropdown'
import {
  TaskStatusLabelMap,
  taskStatusOptions,
} from '../../View/ListView/CreateTaskForm/StatusDropdown'
import { CreateTaskListModal } from '../CreateTaskListModal'
import { AssigneeFilter } from './AssigneeFilter'
import { DateFilter } from './DateFilter'
import { FilterDropdown } from './FilterDropdown'
import { useHooks } from './hooks'
import { MyTasksFilter } from './MyTasksFilter'
import { PersonalTasksFilter } from './PersonalTasksFilter'
import { TaskSearchFilter } from './TaskSearchFilter'

interface TaskToolbarProps {
  onCreateMilestone?: () => void
  onCreateMilestoneItem?: () => void
}

export const TaskToolbar = ({
  onCreateMilestoneItem,
}: TaskToolbarProps = {}) => {
  const [isCreateTaskListModalOpen, setIsCreateTaskListModalOpen] =
    useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const isMenuOpen = Boolean(anchorEl)

  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(
    null,
  )
  const {
    handleClearAssigneeFilter,
    handleClearDateFilter,
    handleClearPriorityFilter,
    handleClearPulseFilter,
    handleClearSearchFilter,
    handleClearStatusFilter,
    handleFilterByAssignee,
    handleFilterByDate,
    handleFilterByDateRange,
    handleFilterByPriority,
    handleFilterByPulse,
    handleFilterByStatus,
    handleResetFilters,
    handleSearchFilter,
    handleToggleMyTasksFilter,
    handleTogglePersonalTasksFilter,
    hasFilters,
    t,
    taskFilters,
    userId,
  } = useHooks()

  const { assigneeId, date, dateRange, status, priority, entityId } =
    taskFilters

  const { user } = useAuthContext()
  const { pulseCategory } = usePulseStore()
  const isPersonalPulse = pulseCategory === PulseCategory.Personal
  const { organizationId } = useOrganization()

  // fetch user's pulses for the dropdown
  const { data: pulsesData } = useGetPulsesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { organizationId },
  })
  const pulses = pulsesData?.pulses ?? []

  const handlePulseFilterChange = (event: SelectChangeEvent) => {
    const value = event.target.value
    if (value === 'all') {
      handleClearPulseFilter()
    } else {
      handleFilterByPulse(value)
    }
  }

  const { pulseMembership } = usePulseStore()

  // checks user's role to determine if they are allowed to create tasks
  const rolePermissions = pulseMembership?.role
    ? PulsePermissionMap[pulseMembership.role]
    : []

  const { checkAccess } = useAccessControl()
  const { grant: hasCreateAccess } = checkAccess(
    [
      PulsePermissionEnum.CREATE_PULSE_TASK,
      PulsePermissionEnum.CREATE_PULSE_TASK_LIST,
    ],
    rolePermissions,
  )

  // Options panel state
  const togglePanel = useTimelineStore((state) => state.togglePanel)

  const handleCustomizeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    togglePanel(event.currentTarget)
  }

  // opens modal for linking calendars
  const {
    isOpen: isSettingsOpen,
    setIsOpen: setIsSettingsOpen,
    setCurrentTab,
  } = useUserSettingsStore()

  // open settings to link/unlink calendar
  const toggleSettingsOpen = () => {
    setCurrentTab(SettingsTabIdentifier['LINKED ACCOUNTS'])
    setIsSettingsOpen(!isSettingsOpen)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleNewTaskList = () => {
    setIsCreateTaskListModalOpen(true)
    handleMenuClose()
  }

  const handleNewTask = () => {
    if (onCreateMilestoneItem) {
      onCreateMilestoneItem()
    }
    handleMenuClose()
  }

  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterMenuAnchor(event.currentTarget)
  }

  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null)
  }

  const isFilterMenuOpen = Boolean(filterMenuAnchor)

  return (
    <Stack width="100%">
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        p={2}
      >
        <Typography color="black" fontWeight="bold" variant="h5">
          {isPersonalPulse ? 'My Tasks' : 'Tasks'}
        </Typography>
        <Stack justifyContent="space-between">
          <Stack alignItems="center" direction="row" spacing={1}>
            <TaskSearchFilter
              onClear={handleClearSearchFilter}
              onSearch={handleSearchFilter}
              searchQuery={taskFilters.search}
            />
            {hasCreateAccess && (
              <>
                <Button
                  endIcon={<KeyboardArrowDown />}
                  onClick={handleMenuOpen}
                  style={{ textTransform: 'none' }}
                  sx={{
                    borderRadius: '8px',
                  }}
                  variant="contained"
                >
                  Add task
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    horizontal: 'left',
                    vertical: 'bottom',
                  }}
                  onClose={handleMenuClose}
                  open={isMenuOpen}
                  slotProps={{
                    paper: {
                      style: {
                        borderRadius: '8px',
                      },
                    },
                  }}
                  transformOrigin={{
                    horizontal: 'left',
                    vertical: 'top',
                  }}
                >
                  <MenuItem
                    onClick={handleNewTaskList}
                    sx={{ fontSize: 'small' }}
                  >
                    {' '}
                    <AddOutlined
                      sx={{ fontSize: 'small', marginRight: '8px' }}
                    />{' '}
                    New Task List
                  </MenuItem>
                  <MenuItem onClick={handleNewTask} sx={{ fontSize: 'small' }}>
                    {' '}
                    <EditOutlined
                      sx={{ fontSize: 'small', marginRight: '8px' }}
                    />{' '}
                    New Task
                  </MenuItem>
                </Menu>
              </>
            )}
          </Stack>
        </Stack>
      </Stack>

      <Divider />

      <Stack direction="row" justifyContent="space-between" p={2}>
        <Stack direction="row" spacing={1}>
          {/* Pulse Filter */}
          {isPersonalPulse && (
            <Select
              onChange={handlePulseFilterChange}
              size="small"
              sx={{ borderRadius: '8px', fontSize: '14px' }}
              value={entityId || 'all'}
            >
              <MenuItem value="all">All Pulses</MenuItem>
              {pulses.map((pulse) => (
                <MenuItem key={pulse.id} value={pulse.id}>
                  {pulse.name}
                </MenuItem>
              ))}
            </Select>
          )}

          <TaskViewSwitcher />
        </Stack>
        <Stack alignItems="center" direction="row" spacing={1}>
          <Button
            onClick={handleFilterMenuOpen}
            startIcon={
              <FilterAltOutlined sx={{ color: 'black', fontSize: 10 }} />
            }
            sx={{
              '&:active, &:focus': {
                '& .MuiSvgIcon-root': {
                  color: 'inherit',
                },
              },
              '&:hover': {
                borderColor: 'grey.200',
              },
              borderColor: 'grey.200',
              borderRadius: '22px',
              height: '32px',
              minWidth: 'fit-content',
            }}
            variant="outlined"
          >
            <Typography
              sx={{
                '.MuiButton-root:active &, .MuiButton-root:focus &': {
                  color: 'inherit',
                },
                color: 'black',
                fontSize: '14px',
                textTransform: 'none',
              }}
            >
              Filter
            </Typography>
          </Button>

          {/* Filter menu */}
          <Menu
            anchorEl={filterMenuAnchor}
            onClose={handleFilterMenuClose}
            open={isFilterMenuOpen}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: '12px',
                  mt: 1,
                  p: 1,
                },
              },
            }}
          >
            <Stack spacing={1.5} sx={{ p: 1 }}>
              <DateFilter
                isActive={!!date || !!dateRange}
                onClear={handleClearDateFilter}
                onSelect={handleFilterByDate}
                onSelectRange={handleFilterByDateRange}
                selectedDate={date}
                selectedDateRange={dateRange}
              />

              <FilterDropdown<TaskStatus>
                isActive={!!status}
                label={
                  status
                    ? toTitleCase(TaskStatusLabelMap[status])
                    : t('status', { ns: 'tasks' })
                }
                onClear={handleClearStatusFilter}
                onSelect={handleFilterByStatus}
                options={taskStatusOptions}
              />

              <FilterDropdown<TaskPriority>
                isActive={!!priority}
                label={
                  priority
                    ? toTitleCase(priority)
                    : t('priority', { ns: 'tasks' })
                }
                onClear={handleClearPriorityFilter}
                onSelect={handleFilterByPriority}
                options={taskPriorityOptions}
              />

              {/* shows tasks created in the user's Personal Pulse */}
              {isPersonalPulse && (
                <PersonalTasksFilter
                  isActive={taskFilters.isPersonalTasks || false}
                  onClick={handleTogglePersonalTasksFilter}
                />
              )}

              {/* shows tasks ASSIGNED to the user */}
              {!isPersonalPulse && (
                <MyTasksFilter
                  isActive={taskFilters.assigneeId === userId}
                  onClick={handleToggleMyTasksFilter}
                />
              )}

              {hasFilters && (
                <ChipButton
                  label={t('remove_filters', { ns: 'tasks' })}
                  onClick={handleResetFilters}
                />
              )}
            </Stack>
          </Menu>

          {!isPersonalPulse && (
            <AssigneeFilter
              isActive={!!assigneeId}
              onClear={handleClearAssigneeFilter}
              onSelect={handleFilterByAssignee}
              selectedAssigneeId={assigneeId}
            />
          )}

          <Stack>
            <Button onClick={toggleSettingsOpen}>
              <Badge
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                badgeContent={
                  <Today
                    sx={{
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      color: 'primary.main',
                      fontSize: 18,
                      padding: '2px',
                    }}
                  />
                }
                overlap="circular"
              >
                <Avatar
                  placeholder={user?.name}
                  size="small"
                  src={user?.gravatar}
                  variant="circular"
                />
              </Badge>
            </Button>
          </Stack>

          <Divider orientation="vertical" />

          <Button
            onClick={handleCustomizeClick}
            startIcon={<Tune />}
            sx={{ color: 'black', textTransform: 'none' }}
            variant="text"
          >
            Customize
          </Button>
        </Stack>
      </Stack>

      <CreateTaskListModal
        isOpen={isCreateTaskListModalOpen}
        onClose={() => setIsCreateTaskListModalOpen(false)}
      />
    </Stack>
  )
}
