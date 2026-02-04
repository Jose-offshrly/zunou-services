import {
  CommentOutlined,
  InboxOutlined,
  TodayOutlined,
} from '@mui/icons-material'
import { Stack } from '@mui/material'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { Routes } from '~/services/Routes'

import { MenuLink } from '.'
import PersonalPulseButton from './PersonalPulseButton'
import ZunouIcon from './ZunouIcon'

interface Props {
  link: MenuLink
  collapsed?: boolean
}

type Selected = 'HOME' | 'TASKS' | 'NOTES' | 'CALENDAR'

export default function PersonalPulseGroup({ link, collapsed }: Props) {
  const { pulseId: pulseIdFromParams, organizationId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [selected, setSelected] = useState<Selected | null>(null)

  const personalPulseId = link.pulseId

  useEffect(() => {
    if (personalPulseId !== pulseIdFromParams) {
      setSelected(null)
      return
    }

    const currentPath = location.pathname

    // Check which route matches the current path
    if (currentPath.includes('/tasks')) {
      setSelected('TASKS')
    } else if (currentPath.includes('/notes')) {
      setSelected('NOTES')
    } else if (currentPath.includes('/calendar')) {
      setSelected('CALENDAR')
    } else if (
      currentPath.includes('/pulse/') &&
      !currentPath.includes('/tasks') &&
      !currentPath.includes('/notes') &&
      !currentPath.includes('/calendar')
    ) {
      setSelected('HOME')
    } else {
      setSelected(null)
    }
  }, [personalPulseId, pulseIdFromParams, location.pathname])

  const handleHomeClick = () => {
    navigate(
      pathFor({
        pathname: Routes.PulseDetail,
        query: { organizationId, pulseId: personalPulseId },
      }),
    )
  }

  const handleTasksClick = () => {
    navigate(
      pathFor({
        pathname: Routes.PulseTasks,
        query: { organizationId, pulseId: personalPulseId },
      }),
    )
  }

  const handleNotesClick = () => {
    navigate(
      pathFor({
        pathname: Routes.PulseNotes,
        query: { organizationId, pulseId: personalPulseId },
      }),
    )
  }

  const handleCalendarClick = () => {
    navigate(
      pathFor({
        pathname: Routes.PulseCalendar,
        query: { organizationId, pulseId: personalPulseId },
      }),
    )
  }

  return (
    <Stack gap={1} width="100%">
      <PersonalPulseButton
        collapsed={collapsed}
        disabled={false}
        icon={
          <ZunouIcon
            color={
              selected === 'HOME'
                ? theme.palette.primary.main
                : theme.palette.text.primary
            }
          />
        }
        onClick={handleHomeClick}
        selected={selected === 'HOME'}
        title="Home"
      />
      <PersonalPulseButton
        className="joyride-onboarding-tour-4"
        collapsed={collapsed}
        disabled={false}
        icon={
          <InboxOutlined
            fontSize="small"
            sx={{
              color: selected === 'TASKS' ? 'primary.main' : 'text.primary',
            }}
          />
        }
        onClick={handleTasksClick}
        selected={selected === 'TASKS'}
        title="My Tasks"
      />
      <PersonalPulseButton
        className="joyride-onboarding-tour-5"
        collapsed={collapsed}
        disabled={false}
        icon={
          <CommentOutlined
            fontSize="small"
            sx={{
              color: selected === 'NOTES' ? 'primary.main' : 'text.primary',
            }}
          />
        }
        onClick={handleNotesClick}
        selected={selected === 'NOTES'}
        title="Notes"
      />
      <PersonalPulseButton
        collapsed={collapsed}
        disabled={false}
        icon={
          <TodayOutlined
            fontSize="small"
            sx={{
              color: selected === 'CALENDAR' ? 'primary.main' : 'text.primary',
            }}
          />
        }
        onClick={handleCalendarClick}
        selected={selected === 'CALENDAR'}
        title="Calendar"
      />
    </Stack>
  )
}
