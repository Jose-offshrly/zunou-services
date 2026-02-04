import { Groups, SmartToyOutlined } from '@mui/icons-material'
import { Stack, Tab, Tabs, Tooltip } from '@mui/material'
import { Pulse, PulseCategory } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form/Button'
import { useTranslation } from 'react-i18next'

import { TabLabel } from '~/components/domain/pulse/PulseNavbar/TabLabel'

interface TabHeaderProps {
  tabIndex: number
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void
  onManageClick: () => void
  pulse: Pulse | null
}

export const TabHeader = ({
  pulse,
  tabIndex,
  onTabChange,
  onManageClick,
}: TabHeaderProps) => {
  const { t } = useTranslation(['common', 'pulse', 'agent'])

  return (
    <Stack
      alignItems="center"
      direction="row"
      justifyContent="space-between"
      mb={2}
    >
      <Tabs
        onChange={onTabChange}
        sx={{
          '& .MuiTab-root': {
            textTransform: 'none',
          },
        }}
        value={tabIndex}
      >
        <Tab label={<TabLabel icon={Groups} label={t('members')} />} />
        <Tooltip title={t('coming_soon')}>
          <span>
            <Tab
              disabled={true}
              label={
                <TabLabel
                  icon={SmartToyOutlined}
                  label={t('ai_agents', { ns: 'agent' })}
                />
              }
            />
          </span>
        </Tooltip>
      </Tabs>
      {pulse?.category !== PulseCategory.Onetoone &&
        pulse?.category !== PulseCategory.Personal && (
          <Button onClick={onManageClick} variant="outlined">
            {t('manage_members', { ns: 'pulse' })}
          </Button>
        )}
    </Stack>
  )
}
