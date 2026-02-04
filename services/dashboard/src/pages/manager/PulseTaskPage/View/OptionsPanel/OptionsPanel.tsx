import {
  CheckCircleOutlined,
  ChevronRight,
  FilterListOutlined,
  GridViewOutlined,
  SortOutlined,
} from '@mui/icons-material'
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormGroup,
  Popover,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import { WeekendDisplay } from '@zunou-graphql/core/graphql'
import { useGetSettingQuery } from '@zunou-queries/core/hooks/useGetSettingQuery'
import { useUpdateSettingMutation } from '@zunou-queries/core/hooks/useUpdateSettingMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import { useTaskStore } from '~/store/useTaskStore'

import { useTimelineStore } from '../../store/useTimelineStore'
import { GroupByField } from '../../utils/taskGrouping'
import { FilterPopover } from './FilterPopover'
import { GroupByPopover } from './GroupByPopover'
import { SortByPopover, TaskSortConfig } from './SortByPopover'
import { StatusManager } from './StatusManager'

const getGroupByLabel = (field: GroupByField): string => {
  if (!field) return 'None'

  const labels: Record<string, string> = {
    assignee: 'Assignee',
    dueDate: 'Due Date',
    priority: 'Priority',
    status: 'Status',
  }

  return labels[field] || 'None'
}

const getSortByLabel = (sort: TaskSortConfig | null): string => {
  if (!sort?.field) return 'None'

  const labels: Record<string, string> = {
    dueDate: 'Due Date',
    priority: 'Priority',
    status: 'Status',
  }

  const directionLabel = sort.direction === 'asc' ? '↑' : '↓'
  return `${labels[sort.field] || sort.field} ${directionLabel}`
}

export const OptionsPanel = () => {
  const { user } = useAuthContext()
  const { organizationId } = useParams()
  const isPanelOpen = useTimelineStore((state) => state.isPanelOpen)
  const panelAnchorEl = useTimelineStore((state) => state.panelAnchorEl)
  const closePanel = useTimelineStore((state) => state.closePanel)
  const viewConfig = useTimelineStore((state) => state.viewConfig)

  const { data: settingData, isLoading: isLoadingSettings } =
    useGetSettingQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: Boolean(user?.id && organizationId),
      variables: {
        organizationId: organizationId,
        userId: user?.id,
      },
    })

  const { mutateAsync: updateSetting } = useUpdateSettingMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const hideWeekend =
    settingData?.setting?.weekendDisplay?.toLowerCase() ===
    WeekendDisplay.Hidden.toLowerCase()
  const blockWeekend =
    settingData?.setting?.weekendDisplay?.toLowerCase() ===
    WeekendDisplay.BlockedOut.toLowerCase()

  const { filters, setFilters } = useTaskStore()

  const groupByField = viewConfig.groupBy.field as GroupByField
  const sortConfig = viewConfig.sort as TaskSortConfig | null

  // Get active filter names
  const { activeFilterCount, activeFilterNames } = useMemo(() => {
    const names: string[] = []
    if (filters.status || filters.excludeStatus) names.push('Status')
    if (filters.priority || filters.excludePriority) names.push('Priority')
    if (filters.assigneeId || filters.excludeAssigneeId) names.push('Assignee')
    if (filters.date || filters.dateRange) names.push('Due Date')

    return {
      activeFilterCount: names.length,
      activeFilterNames: names,
    }
  }, [filters])

  const getFilterLabel = (): string => {
    if (activeFilterCount === 0) return 'None'
    return `(${activeFilterNames.join(', ')})`
  }

  const [groupByAnchorEl, setGroupByAnchorEl] = useState<HTMLElement | null>(
    null,
  )
  const isGroupByOpen = Boolean(groupByAnchorEl)

  const [sortByAnchorEl, setSortByAnchorEl] = useState<HTMLElement | null>(null)
  const isSortByOpen = Boolean(sortByAnchorEl)

  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null)
  const isFilterOpen = Boolean(filterAnchorEl)

  const [isStatusManagerOpen, setIsStatusManagerOpen] = useState(false)
  const [isUpdatingWeekend, setIsUpdatingWeekend] = useState(false)

  const handleGroupByClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setGroupByAnchorEl(event.currentTarget)
  }

  const handleGroupByClose = () => {
    setGroupByAnchorEl(null)
  }

  const handleSortByClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSortByAnchorEl(event.currentTarget)
  }

  const handleSortByClose = () => {
    setSortByAnchorEl(null)
  }

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget)
  }

  const handleFilterClose = () => {
    setFilterAnchorEl(null)
  }

  const handleShowClosedTasksToggle = () => {
    setFilters({ showCompletedTasks: !filters.showCompletedTasks })
  }

  const handleBlockWeekendToggle = async () => {
    if (!settingData?.setting?.id || isUpdatingWeekend) return

    setIsUpdatingWeekend(true)
    try {
      const newValue = blockWeekend
        ? WeekendDisplay.Default
        : WeekendDisplay.BlockedOut
      await updateSetting({
        color: settingData.setting.color ?? '',
        mode: settingData.setting.mode ?? '',
        settingId: settingData.setting.id,
        theme: settingData.setting.theme ?? '',
        weekendDisplay: newValue,
      })
    } catch (error) {
      toast.error('Failed to update weekend display setting')
    } finally {
      setIsUpdatingWeekend(false)
    }
  }

  const handleHideWeekendToggle = async () => {
    if (!settingData?.setting?.id || isUpdatingWeekend) return

    setIsUpdatingWeekend(true)
    try {
      const newValue = hideWeekend
        ? WeekendDisplay.Default
        : WeekendDisplay.Hidden

      await updateSetting({
        color: settingData.setting.color ?? '',
        mode: settingData.setting.mode ?? '',
        settingId: settingData.setting.id,
        theme: settingData.setting.theme ?? '',
        weekendDisplay: newValue,
      })
    } catch (error) {
      toast.error('Failed to update weekend display setting')
    } finally {
      setIsUpdatingWeekend(false)
    }
  }

  const isShowingClosedTasks = filters.showCompletedTasks ?? false

  return (
    <Popover
      anchorEl={panelAnchorEl}
      anchorOrigin={{
        horizontal: 'left',
        vertical: 'bottom',
      }}
      onClose={closePanel}
      open={isPanelOpen}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '18px',
            marginTop: 1,
            minWidth: '450px',
          },
        },
      }}
      transformOrigin={{
        horizontal: 'left',
        vertical: 'top',
      }}
    >
      <Stack padding={2} spacing={2}>
        <Typography fontWeight="bold">Customize View</Typography>
      </Stack>

      <Divider />

      {isLoadingSettings ? (
        <Box
          alignItems="center"
          display="flex"
          justifyContent="center"
          padding={4}
        >
          <CircularProgress size={24} />
        </Box>
      ) : (
        <>
          <Stack padding={2}>
            <FormGroup>
              <Stack
                alignItems="center"
                direction="row"
                justifyContent="space-between"
              >
                <Typography>Show closed tasks</Typography>
                <Switch
                  checked={isShowingClosedTasks}
                  onChange={handleShowClosedTasksToggle}
                />
              </Stack>

              <Stack
                alignItems="center"
                direction="row"
                justifyContent="space-between"
              >
                <Typography>Block out weekends</Typography>
                <Switch
                  checked={blockWeekend}
                  disabled={isUpdatingWeekend || !settingData?.setting}
                  onChange={handleBlockWeekendToggle}
                />
              </Stack>

              <Stack
                alignItems="center"
                direction="row"
                justifyContent="space-between"
              >
                <Typography>Hide weekends</Typography>
                <Switch
                  checked={hideWeekend}
                  disabled={isUpdatingWeekend || !settingData?.setting}
                  onChange={handleHideWeekendToggle}
                />
              </Stack>
            </FormGroup>
          </Stack>

          <Divider />

          {/* Group by customization */}
          <Stack padding={2}>
            <Button
              onClick={handleGroupByClick}
              sx={{
                '& .MuiTouchRipple-root .MuiTouchRipple-child': {
                  backgroundColor: 'grey.200',
                },
                ':hover': {
                  backgroundColor: 'grey.100',
                },
                justifyContent: 'space-between',
              }}
            >
              <Stack alignItems="center" direction="row" spacing={1}>
                <GridViewOutlined
                  fontSize="small"
                  sx={{ color: 'text.secondary' }}
                />
                <Typography
                  sx={{ color: 'text.secondary', textTransform: 'none' }}
                >
                  Group
                </Typography>
              </Stack>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Typography sx={{ color: 'text.secondary', fontSize: '14px' }}>
                  {getGroupByLabel(groupByField)}
                </Typography>
                <ChevronRight
                  fontSize="small"
                  sx={{ color: 'text.secondary' }}
                />
              </Stack>
            </Button>

            <GroupByPopover
              anchorEl={groupByAnchorEl}
              onClose={handleGroupByClose}
              open={isGroupByOpen}
            />
          </Stack>

          <Divider />

          {/* Sort button */}
          <Stack padding={2}>
            <Button
              onClick={handleSortByClick}
              sx={{
                '& .MuiTouchRipple-root .MuiTouchRipple-child': {
                  backgroundColor: 'grey.200',
                },
                ':hover': {
                  backgroundColor: 'grey.100',
                },
                justifyContent: 'space-between',
              }}
            >
              <Stack alignItems="center" direction="row" spacing={1}>
                <SortOutlined
                  fontSize="small"
                  sx={{ color: 'text.secondary' }}
                />
                <Typography
                  sx={{ color: 'text.secondary', textTransform: 'none' }}
                >
                  Sort
                </Typography>
              </Stack>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Typography sx={{ color: 'text.secondary', fontSize: '14px' }}>
                  {getSortByLabel(sortConfig)}
                </Typography>
                <ChevronRight
                  fontSize="small"
                  sx={{ color: 'text.secondary' }}
                />
              </Stack>
            </Button>

            <SortByPopover
              anchorEl={sortByAnchorEl}
              onClose={handleSortByClose}
              open={isSortByOpen}
            />
          </Stack>

          <Divider />

          {/* Status filter */}
          <Stack padding={2}>
            <Button
              onClick={() => setIsStatusManagerOpen(true)}
              sx={{
                '& .MuiTouchRipple-root .MuiTouchRipple-child': {
                  backgroundColor: 'grey.200',
                },
                ':hover': {
                  backgroundColor: 'grey.100',
                },
                justifyContent: 'space-between',
              }}
            >
              <Stack alignItems="center" direction="row" spacing={1}>
                <CheckCircleOutlined
                  fontSize="small"
                  sx={{ color: 'text.secondary' }}
                />
                <Typography
                  sx={{ color: 'text.secondary', textTransform: 'none' }}
                >
                  Status
                </Typography>
              </Stack>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Typography
                  sx={{ color: 'text.secondary', textTransform: 'none' }}
                >
                  Default
                </Typography>
                <ChevronRight
                  fontSize="small"
                  sx={{ color: 'text.secondary' }}
                />
              </Stack>
            </Button>
          </Stack>

          {/* Filter */}
          <Stack padding={2}>
            <Button
              onClick={handleFilterClick}
              sx={{
                '& .MuiTouchRipple-root .MuiTouchRipple-child': {
                  backgroundColor: 'grey.200',
                },
                ':hover': {
                  backgroundColor: 'grey.100',
                },
                justifyContent: 'space-between',
              }}
            >
              <Stack alignItems="center" direction="row" spacing={1}>
                <FilterListOutlined
                  fontSize="small"
                  sx={{ color: 'text.secondary' }}
                />
                <Typography
                  sx={{ color: 'text.secondary', textTransform: 'none' }}
                >
                  Filter
                </Typography>
              </Stack>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Typography
                  sx={{
                    color:
                      activeFilterCount > 0 ? 'primary.main' : 'text.secondary',
                    fontSize: '14px',
                    fontWeight: activeFilterCount > 0 ? 'bold' : 'normal',
                  }}
                >
                  {getFilterLabel()}
                </Typography>
                <ChevronRight
                  fontSize="small"
                  sx={{ color: 'text.secondary' }}
                />
              </Stack>
            </Button>

            <FilterPopover
              anchorEl={filterAnchorEl}
              onClose={handleFilterClose}
              open={isFilterOpen}
            />
          </Stack>

          <StatusManager
            onClose={() => setIsStatusManagerOpen(false)}
            open={isStatusManagerOpen}
          />
        </>
      )}
    </Popover>
  )
}
