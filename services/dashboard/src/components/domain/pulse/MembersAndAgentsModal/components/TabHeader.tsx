import { Groups, SmartToyOutlined } from '@mui/icons-material'
import { Stack, Tab, Tabs } from '@mui/material'
import { PulseCategory, PulseMemberRole } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form/Button'
import { useTranslation } from 'react-i18next'

import { TabLabel } from '~/components/domain/pulse/PulseNavbar/TabLabel'
import { usePulseStore } from '~/store/usePulseStore'

import { TabType } from './PulseManagement'

interface TabHeaderProps {
  tabIndex: TabType
  onTabChange: (newValue: number) => void
  onManageClick: () => void
  onAgentStoreClick: () => void
}

export const TabHeader = ({
  tabIndex,
  onTabChange,
  onManageClick,
  onAgentStoreClick,
}: TabHeaderProps) => {
  const { pulseMembership } = usePulseStore()
  const { t } = useTranslation(['common', 'pulse', 'agent'])

  return (
    <Stack
      alignItems="center"
      direction="row"
      justifyContent="space-between"
      mb={2}
    >
      <Tabs
        onChange={(_, value: number) => onTabChange(value)}
        sx={{
          '& .MuiTab-root': {
            textTransform: 'none',
          },
        }}
        value={tabIndex}
      >
        <Tab label={<TabLabel icon={Groups} label={t('members')} />} />
        <Tab
          label={
            <TabLabel
              icon={SmartToyOutlined}
              label={t('ai_agents', { ns: 'agent' })}
            />
          }
        />
      </Tabs>
      {PulseCategory.Team &&
        pulseMembership?.role !== PulseMemberRole.Guest &&
        (tabIndex === TabType.MEMBERS ? (
          <Button onClick={onManageClick} variant="outlined">
            {t('manage_members', { ns: 'pulse' })}
          </Button>
        ) : tabIndex === TabType.AI_AGENTS ? (
          <Button onClick={onAgentStoreClick} variant="contained">
            {t('agent_store', { ns: 'agent' })}
          </Button>
        ) : null)}
    </Stack>
  )
}
