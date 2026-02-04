import { Stack, Typography } from '@mui/material'
import { useGetIntegration } from '@zunou-queries/core/hooks/useGetIntegration'
import awsIcon from '@zunou-react/assets/images/aws-icon.png'
import firefliesIcon from '@zunou-react/assets/images/fireflies-icon.png'
import githubIcon from '@zunou-react/assets/images/github-icon.png'
import slackIcon from '@zunou-react/assets/images/slack-icon.png'
import xeroIcon from '@zunou-react/assets/images/xero-icon.png'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { useIntegrationContext } from '~/context/IntegrationContext'

import {
  AWSIntegration,
  FirefliesIntegration,
  GithubIntegration,
  IntegrationItem,
  SlackIntegration,
  ViewWebhook,
  XeroIntegration,
} from './components'

export const IntegrationsTab = () => {
  const { t } = useTranslation('sources')
  const { user } = useAuthContext()
  const { pulseId } = useParams<{ pulseId: string }>()
  const { currentView, setCurrentView } = useIntegrationContext()

  const {
    data: firefliesIntegrationData,
    isFetching: isFetchingFirefliesIntegration,
  } = useGetIntegration({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      pulseId: pulseId,
      type: 'fireflies',
      userId: user?.id,
    },
  })
  const {
    data: githubIntegrationData,
    isFetching: isFetchingGithubIntegration,
  } = useGetIntegration({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      pulseId: pulseId,
      type: 'github',
      userId: user?.id,
    },
  })
  const { data: awsIntegrationData, isFetching: isFetchingAWSIntegration } =
    useGetIntegration({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        pulseId,
        type: 'aws',
        userId: user?.id,
      },
    })
  const hasAWSIntegration = Boolean(awsIntegrationData?.integration)
  const hasFirefliesIntegration = Boolean(firefliesIntegrationData?.integration)
  const hasGithubIntegration = Boolean(githubIntegrationData?.integration)

  const integrations = useMemo(
    () => [
      {
        apiKeyView: 'AddFireflies',
        isAdded: hasFirefliesIntegration,
        logo: firefliesIcon,
        name: 'Fireflies',
        webhookUrlView: 'AddFirefliesWebhook',
      },
      {
        apiKeyView: 'AddGithub',
        isAdded: hasGithubIntegration,
        logo: githubIcon,
        name: 'GitHub',
        webhookUrlView: 'ViewGithubWebhook',
      },
      {
        apiKeyView: 'AddAWS',
        isAdded: hasAWSIntegration,
        logo: awsIcon,
        name: 'AWS',
        webhookUrlView: 'ViewAWSWebhook',
      },
      {
        apiKeyView: 'AddSlack',
        isAdded: false,
        logo: slackIcon,
        name: 'Slack',
        webhookUrlView: 'AddSlackWebhook',
      },
      {
        apiKeyView: 'AddXero',
        isAdded: false,
        logo: xeroIcon,
        name: 'Xero',
        webhookUrlView: 'AddXeroWebhook',
      },
    ],
    [hasFirefliesIntegration, hasGithubIntegration, hasAWSIntegration],
  )

  const handleBack = () => {
    setCurrentView(null)
  }

  const renderView = () => {
    switch (currentView) {
      case 'AddAWS':
        return <AWSIntegration handleBack={handleBack} icon={awsIcon} />
      case 'AddFireflies':
        return (
          <FirefliesIntegration handleBack={handleBack} icon={firefliesIcon} />
        )
      case 'AddSlack':
        return <SlackIntegration handleBack={handleBack} icon={slackIcon} />
      case 'AddXero':
        return <XeroIntegration handleBack={handleBack} icon={xeroIcon} />
      case 'AddFirefliesWebhook':
        return (
          <ViewWebhook
            description="Fireflies.ai webhooks notify you of events by sending messages to your URL, enabling workflow automation and integrations."
            handleBack={handleBack}
            icon={firefliesIcon}
            title="fireflies.ai"
          />
        )
      case 'AddGithub':
        return <GithubIntegration handleBack={handleBack} icon={githubIcon} />
      default:
        return (
          <Stack spacing={2}>
            <Typography fontWeight="bold" variant="h6">
              {t('integrations')}
            </Typography>
            <Stack spacing={1}>
              {integrations.map(
                ({ isAdded, logo, name, apiKeyView, webhookUrlView }) => (
                  <IntegrationItem
                    isAdded={isAdded}
                    isLoading={
                      name === 'Fireflies'
                        ? isFetchingFirefliesIntegration
                        : name === 'GitHub'
                          ? isFetchingGithubIntegration
                          : name === 'AWS'
                            ? isFetchingAWSIntegration
                            : false
                    }
                    key={name}
                    logo={logo}
                    name={name}
                    onAddApiKey={() => setCurrentView(apiKeyView)}
                    onViewWebhookUrl={() => setCurrentView(webhookUrlView)}
                  />
                ),
              )}
            </Stack>
          </Stack>
        )
    }
  }

  return renderView()
}
