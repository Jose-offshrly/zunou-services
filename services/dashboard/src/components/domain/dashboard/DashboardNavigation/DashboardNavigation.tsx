import {
  ChecklistOutlined,
  // SmartToyOutlined
} from '@mui/icons-material'
import { Tab, Tabs } from '@mui/material'
import { Stack } from '@mui/system'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

export enum DashboardTab {
  RelayWall = 'RELAY_WALL',
  Feed = 'FEED',
}

interface DashboardNavigationProps {
  selectedTab?: DashboardTab
  onTabChange?: (tab: DashboardTab) => void
  defaultTab?: DashboardTab
}

const DashboardNavigation = ({
  selectedTab: externalSelectedTab,
  onTabChange,
  defaultTab = DashboardTab.RelayWall,
}: DashboardNavigationProps) => {
  const { t } = useTranslation('feed')
  const [internalSelectedTab, setInternalSelectedTab] =
    useState<DashboardTab>(defaultTab)

  const isControlled = externalSelectedTab !== undefined
  const activeTab = isControlled ? externalSelectedTab : internalSelectedTab

  const handleSelectTab = (
    _event: React.SyntheticEvent,
    newValue: DashboardTab,
  ): void => {
    if (!isControlled) {
      setInternalSelectedTab(newValue)
    }

    if (onTabChange) {
      onTabChange(newValue)
    }
  }

  return (
    <Stack
      bgcolor="Background"
      borderBottom={1}
      borderColor="divider"
      direction="row"
      justifyContent="end"
      px={2}
    >
      <Tabs
        onChange={handleSelectTab}
        sx={{
          '& .MuiTab-root': {
            minHeight: 60,
            textTransform: 'none',
          },
          minHeight: 60,
        }}
        value={activeTab}
      >
        <Tab
          disableRipple={true}
          icon={<ChecklistOutlined fontSize="small" />}
          iconPosition="start"
          label={t('feed')}
          sx={{ gap: 0.5 }}
          value={DashboardTab.Feed}
        />
      </Tabs>
    </Stack>
  )
}

export default DashboardNavigation
