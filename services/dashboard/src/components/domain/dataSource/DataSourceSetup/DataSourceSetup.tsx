import ContentPasteOutlinedIcon from '@mui/icons-material/ContentPasteOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import IntegrationInstructionsOutlinedIcon from '@mui/icons-material/IntegrationInstructionsOutlined'
import { Icon, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Button } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { CustomModal } from '~/components/ui/CustomModal'
import {
  TabIdentifier,
  useDataSourceContext,
} from '~/context/DataSourceContext'
import { useIntegrationContext } from '~/context/IntegrationContext'
import { toTitleCase } from '~/utils/textUtils'

import { ContentTab, IntegrationsTab, MeetingsTab } from './tabs'

const getTabIcon = (id: TabIdentifier) => {
  switch (id) {
    case TabIdentifier.CONTENT:
      return ContentPasteOutlinedIcon
    case TabIdentifier.MEETINGS:
      return GroupsOutlinedIcon
    case TabIdentifier.INTEGRATIONS:
      return IntegrationInstructionsOutlinedIcon
    default:
      return ContentPasteOutlinedIcon
  }
}

interface DataSourceSetupProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  pulseId?: string
  initialTab?: string | null
}

export const DataSourceSetup = ({
  isOpen,
  onClose,
  organizationId,
  pulseId,
  initialTab,
}: DataSourceSetupProps) => {
  const { t } = useTranslation('sources')
  const { setCurrentView } = useIntegrationContext()

  const tabs = Object.values(TabIdentifier).map((value) => ({
    icon: getTabIcon(value),
    id: value,
    label: toTitleCase(t(value)),
  }))

  const { activeTab, setActiveTab } = useDataSourceContext()

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab as TabIdentifier)
  }, [initialTab])

  useEffect(() => {
    if (
      isOpen &&
      initialTab &&
      Object.values(TabIdentifier).includes(initialTab as TabIdentifier)
    ) {
      setActiveTab(initialTab as TabIdentifier)
    }
  }, [isOpen, initialTab])

  const handleSelectTab = (id: TabIdentifier) => {
    setActiveTab(id)
    setCurrentView(null)
  }

  return (
    <CustomModal
      isOpen={isOpen}
      maxHeight={556}
      maxWidth={1000}
      minHeight={556}
      onClose={onClose}
      title={t('source')}
    >
      <Stack direction="row" height="100%" spacing={2}>
        <Stack minWidth={200} spacing={1}>
          {tabs.map(({ icon, id, label }, index) => (
            <Button
              key={index}
              onClick={() => handleSelectTab(id)}
              startIcon={<Icon component={icon} fontSize="small" />}
              sx={{
                alignItems: 'start',
                bgcolor:
                  activeTab === id
                    ? alpha(theme.palette.primary.main, 0.2)
                    : '',
                color: 'text.primary',
                justifyContent: 'start',
                paddingX: 2,
                paddingY: 1,
              }}
            >
              <Typography fontSize={14} fontWeight={4}>
                {label}
              </Typography>
            </Button>
          ))}
        </Stack>

        <Stack
          flex={1}
          px={2}
          sx={{
            height: '100%',
            overflow: 'auto',
          }}
        >
          {activeTab === TabIdentifier.CONTENT && (
            <ContentTab
              onClose={onClose}
              organizationId={organizationId}
              pulseId={pulseId}
            />
          )}
          {activeTab === TabIdentifier.MEETINGS && <MeetingsTab />}
          {activeTab === TabIdentifier.INTEGRATIONS && <IntegrationsTab />}
        </Stack>
      </Stack>
    </CustomModal>
  )
}
