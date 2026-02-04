import {
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
} from '@mui/icons-material'
import PeopleIcon from '@mui/icons-material/People'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import {
  alpha,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material'
import { PulseMember } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useOrganization } from '~/hooks/useOrganization'
import { isMobileDevice } from '~/utils/mobileDeviceUtils'

import { AgentsList } from './AgentsList'
import { UnassignedMemberList } from './UnassignedMemberList'

const SIDEBAR_STATE_KEY = 'org-chart-sidebar-expanded'

interface SidebarProps {
  members: PulseMember[]
  isExpanded: boolean
  isSidebarExpanded: boolean
  canEdit: boolean
  setIsSidebarExpanded: (isExpanded: boolean) => void
}

export const Sidebar = ({
  members,
  isExpanded,
  isSidebarExpanded,
  setIsSidebarExpanded,
  canEdit,
}: SidebarProps) => {
  const { t } = useTranslation(['common', 'agent'])
  const { organization } = useOrganization()

  const [activeTab, setActiveTab] = useState<'members' | 'agents'>('members')

  useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_STATE_KEY)

    if (isMobileDevice()) {
      // On mobile, always default to collapsed regardless of saved state
      setIsSidebarExpanded(true)
    } else if (savedState !== null) {
      // On desktop, use saved state
      const parsedState = JSON.parse(savedState) as boolean
      setIsSidebarExpanded(parsedState)
    }
  }, [setIsSidebarExpanded])

  const handleSidebarToggle = (newState: boolean) => {
    setIsSidebarExpanded(newState)

    // Only save to localStorage if not on mobile device
    if (!isMobileDevice()) {
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(newState))
    }
  }

  const TABS = [
    {
      disabled: false,
      icon: <PeopleIcon sx={{ fontSize: 20 }} />,
      label: `${t('members')} (${members.length})`,
      value: 'members',
    },
    {
      disabled: true,
      icon: <SmartToyIcon sx={{ fontSize: 20 }} />,
      label: t('ai_agents', { ns: 'agent' }),
      value: 'agents',
    },
  ]

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: 'members' | 'agents',
  ) => {
    setActiveTab(newValue)
  }

  return (
    <Stack
      border={1}
      height="100%"
      maxWidth={{ lg: 400, xs: 300 }}
      minWidth={isSidebarExpanded ? 20 : { lg: 400, xs: 300 }}
      sx={{
        borderColor: 'divider',
        flex: '0 0 auto',
        flexShrink: 0,
        width: !isSidebarExpanded ? { lg: 400, xs: 300 } : 80,
      }}
    >
      <Stack divider={isSidebarExpanded ? <Divider /> : null} p={2} spacing={2}>
        <Stack
          direction="row"
          justifyContent={isSidebarExpanded ? 'center' : 'space-between'}
        >
          {!isSidebarExpanded && (
            <Typography fontSize={24} fontWeight={600}>
              {organization?.name}
            </Typography>
          )}

          <IconButton
            onClick={() => handleSidebarToggle(!isSidebarExpanded)}
            sx={{
              alignSelf: 'center',
              border: 1,
              borderColor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: '50%',
              p: 0.5,
            }}
          >
            {!isSidebarExpanded ? (
              <KeyboardDoubleArrowLeft />
            ) : (
              <KeyboardDoubleArrowRight />
            )}
          </IconButton>
        </Stack>

        {!isSidebarExpanded ? (
          <Tabs
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
            value={activeTab}
          >
            {TABS.map(({ label, icon, value, disabled }) => (
              <Tooltip
                PopperProps={{
                  modifiers: [
                    {
                      name: 'offset',
                      options: {
                        offset: [0, -8],
                      },
                    },
                  ],
                }}
                key={value}
                placement="top"
                sx={{
                  '& .MuiTooltip-tooltip': {
                    backgroundColor: 'common.white',
                    color: 'common.black',
                    fontSize: 12,
                  },
                }}
                title={value === 'agents' ? 'Coming Soon' : ''}
              >
                <div style={{ width: '100%' }}>
                  <Tab
                    disabled={disabled}
                    icon={icon}
                    iconPosition="start"
                    label={label}
                    sx={{
                      flexGrow: 1,
                      minWidth: 0,
                      p: 0,
                      textAlign: 'left',
                      width: '100%',
                    }}
                    value={value}
                  />
                </div>
              </Tooltip>
            ))}
          </Tabs>
        ) : (
          <Stack divider={<Divider />} spacing={2}>
            {TABS.map(({ icon, value }) => (
              <IconButton
                key={value}
                onClick={() => {
                  setActiveTab(value as 'members' | 'agents')
                  handleSidebarToggle(!isSidebarExpanded)
                }}
              >
                {icon}
              </IconButton>
            ))}
          </Stack>
        )}
      </Stack>
      {!isSidebarExpanded && (
        <Stack sx={{ height: '100%', maxHeight: '100%', overflowY: 'auto' }}>
          {activeTab === 'members' ? (
            <UnassignedMemberList
              canEdit={canEdit}
              isExpanded={isExpanded}
              members={members}
            />
          ) : (
            <AgentsList />
          )}
        </Stack>
      )}
    </Stack>
  )
}
