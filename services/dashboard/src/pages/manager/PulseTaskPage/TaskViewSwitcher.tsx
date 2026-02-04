import {
  ClearAll,
  ListOutlined,
  TableChartOutlined,
  ViewKanbanOutlined,
} from '@mui/icons-material'
import {
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { theme } from '@zunou-react/services/Theme'

import { TaskViewType, useTaskViewStore } from './store/useTaskViewStore'

const viewOptions: {
  value: TaskViewType
  label: string
  icon: React.ReactNode
}[] = [
  {
    icon: <ListOutlined fontSize="small" />,
    label: 'List',
    value: 'list',
  },
  {
    icon: <ClearAll fontSize="small" />,
    label: 'Gantt',
    value: 'gantt',
  },
  {
    icon: <TableChartOutlined fontSize="small" />,
    label: 'Table',
    value: 'table',
  },
  {
    icon: <ViewKanbanOutlined fontSize="small" />,
    label: 'Kanban',
    value: 'kanban',
  },
]

export const TaskViewSwitcher = () => {
  const currentView = useTaskViewStore((state) => state.currentView)
  const setCurrentView = useTaskViewStore((state) => state.setCurrentView)

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: TaskViewType | null,
  ) => {
    if (newView !== null) {
      setCurrentView(newView)
    }
  }

  // const selectedOption = viewOptions.find((opt) => opt.value === currentView)

  return (
    <Stack alignItems="center" direction="row" spacing={2}>
      <ToggleButtonGroup
        aria-label="task view switcher"
        exclusive={true}
        onChange={handleChange}
        sx={{
          '& .MuiToggleButton-root': {
            '&.Mui-selected': {
              backgroundColor: theme.palette.primary.main + '20',
              borderRadius: '8px',
              color: theme.palette.primary.main,
            },
            '&:first-of-type': {
              borderBottomLeftRadius: '40px',
              borderTopLeftRadius: '40px',
            },
            '&:last-of-type': {
              borderBottomRightRadius: '40px',
              borderTopRightRadius: '40px',
            },
            '&:not(:last-of-type)': {
              borderRight: 'none',
            },
            paddingY: 1,
          },
        }}
        value={currentView}
      >
        {viewOptions.map((option) => (
          <ToggleButton
            aria-label={option.value}
            key={option.value}
            value={option.value}
          >
            <Stack alignItems="center" direction="row" spacing={1}>
              {option.icon}
              <Typography sx={{ fontSize: '14px', textTransform: 'none' }}>
                {option.label}
              </Typography>
            </Stack>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  )
}
