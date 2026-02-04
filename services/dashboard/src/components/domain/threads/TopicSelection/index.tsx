import {
  Assessment,
  Groups,
  Handshake,
  PersonSearch,
} from '@mui/icons-material'
import { CircularProgress, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { useCreateAssistantOnboardingMutation } from '@zunou-queries/core/hooks/useCreateAssistantOnboardingMutation'
import { useGenerateThreadTitleMutation } from '@zunou-queries/core/hooks/useGenerateThreadTitleMutation'
import zunouLogo from '@zunou-react/assets/images/zunou-logo.svg'
import { Image } from '@zunou-react/components/utility'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import TopicCard from '~/components/domain/threads/TopicCard/TopicCard'
import { Routes } from '~/services/Routes'

export const TopicSelection = () => {
  const [isLoading, setLoading] = useState(false)
  const { organizationId } = useParams()
  const navigate = useNavigate()

  const {
    mutateAsync: createAssistantOnboarding,
    isPending: isPendingCreateAssitantOnboarding,
  } = useCreateAssistantOnboardingMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { mutateAsync: generateThreadTitle } = useGenerateThreadTitleMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleOnboarding = async () => {
    try {
      setLoading(true)
      if (!organizationId) {
        throw new Error('No organization ID provided')
      }
      const response = await createAssistantOnboarding({
        organizationId,
      })

      await generateThreadTitle({
        threadId: response.createAssistantOnboarding.id,
      })

      navigate(
        Routes.ThreadDetail.replace(':organizationId', organizationId).replace(
          ':threadId',
          response.createAssistantOnboarding.id,
        ),
      )
    } catch (error) {
      console.error('Error setting up onboarding thread:', error)
    } finally {
      setLoading(false)
    }
  }

  const threadTopics = [
    {
      action: handleOnboarding,
      description:
        'Be guided as you upload company documents as your data source.',
      icon: Handshake,
      isAvailable: true,
      title: 'Onboarding',
    },
    {
      action: () => alert('implement recruitment'),
      description: 'Coming soon',
      icon: PersonSearch,
      isAvailable: false,
      title: 'Recruitment',
    },
    {
      action: () => alert('implement employee mgmt'),
      description: 'Coming soon',
      icon: Groups,
      isAvailable: false,
      title: 'Employee Management',
    },
    {
      action: () => alert('implement reports and analysis'),
      description: 'Coming soon',
      icon: Assessment,
      isAvailable: false,
      title: 'Reports and Analysis',
    },
  ]

  if (isLoading || isPendingCreateAssitantOnboarding)
    return <CircularProgress />

  return (
    <Stack
      alignItems="center"
      height="100vh"
      justifyContent="center"
      spacing={3}
    >
      <Image alt="Logo" height={96} src={zunouLogo} style={{ width: 'auto' }} />
      <Typography maxWidth={400} textAlign="center">
        Get instant help and guidance whenever you need it— quick, simple, and
        always here for you.
      </Typography>
      <Stack direction="row" spacing={1}>
        {threadTopics.map(
          ({ action, description, icon, isAvailable, title }, index) => {
            return (
              <TopicCard
                action={action}
                description={description}
                icon={icon}
                isAvailable={isAvailable}
                key={index}
                title={title}
              />
            )
          },
        )}
      </Stack>
    </Stack>
  )
}
