import {
  EditOutlined,
  IntegrationInstructionsOutlined,
} from '@mui/icons-material'
import { IconButton, Stack, Typography } from '@mui/material'
import { alpha, lighten } from '@mui/system'
import awsIcon from '@zunou-react/assets/images/aws-icon.png'
import firefliesIcon from '@zunou-react/assets/images/fireflies-icon.png'
import githubIcon from '@zunou-react/assets/images/github-icon.png'
import slackIcon from '@zunou-react/assets/images/slack-icon.png'
import xeroIcon from '@zunou-react/assets/images/xero-icon.png'
import { EmptyState } from '@zunou-react/components/layout/EmptyState'
import { theme } from '@zunou-react/services/Theme'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { TabIdentifier } from '~/context/DataSourceContext'

const getIcon = (type: string) => {
  switch (type) {
    case 'aws':
      return awsIcon
    case 'fireflies':
      return firefliesIcon
    case 'slack':
      return slackIcon
    case 'xero':
      return xeroIcon
    case 'github':
      return githubIcon
  }
}

interface IntegrationsListProps {
  isLoading: boolean
  integrations: {
    id: string
    type: string
  }[]
  onOpenDataSourceSetup: (tab: string) => void
  setCurrentView: React.Dispatch<React.SetStateAction<string | null>>
}

export const IntegrationsList = ({
  isLoading,
  integrations,
  onOpenDataSourceSetup,
  setCurrentView,
}: IntegrationsListProps) => {
  const { t } = useTranslation('sources')

  if (isLoading) return <LoadingSkeleton height={40} />

  if (integrations.length === 0) {
    return (
      <EmptyState
        icon={
          <IntegrationInstructionsOutlined
            sx={{ color: lighten(theme.palette.text.primary, 0.5) }}
          />
        }
        message={t('no_integrations')}
        onClick={() => onOpenDataSourceSetup(TabIdentifier.INTEGRATIONS)}
      />
    )
  }

  return (
    <Stack spacing={1}>
      {integrations.map((integration) => {
        const capitalized =
          integration.type.charAt(0).toUpperCase() + integration.type.slice(1)

        return (
          <Stack
            alignItems="center"
            border={1}
            borderColor={alpha(theme.palette.primary.main, 0.1)}
            borderRadius={1}
            direction="row"
            justifyContent="space-between"
            key={integration.id}
            p={1.5}
          >
            <Stack alignItems="center" direction="row" spacing={1}>
              <img
                alt={integration.type}
                height={20}
                src={getIcon(integration.type)}
                width={20}
              />
              <Typography fontSize={14} fontWeight={500}>
                {integration.type}
              </Typography>
            </Stack>

            <IconButton
              aria-label={`Edit ${integration.type} integration`}
              onClick={() => {
                setCurrentView(`Add${capitalized}`)
                onOpenDataSourceSetup(TabIdentifier.INTEGRATIONS)
              }}
              size="small"
            >
              <EditOutlined fontSize="small" />
            </IconButton>
          </Stack>
        )
      })}
    </Stack>
  )
}
