import { Clear } from '@mui/icons-material'
import AddIcon from '@mui/icons-material/Add'
import { Divider, Stack, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useDeleteIntegrationMutation } from '@zunou-queries/core/hooks/useDeleteIntegration'
import { useGetIntegration } from '@zunou-queries/core/hooks/useGetIntegration'
import { Button } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'

interface IntegrationItemProps {
  isLoading: boolean
  logo: string
  name: string
  isAdded: boolean
  onAddApiKey: () => void
  onViewWebhookUrl: () => void
}

export const IntegrationItem = ({
  isLoading,
  logo,
  name,
  isAdded,
  onAddApiKey,
  onViewWebhookUrl,
}: IntegrationItemProps) => {
  const { t } = useTranslation(['common', 'sources'])
  const integrationType = name.toLowerCase()
  const { user } = useAuthContext()
  const { pulseId } = useParams<{ pulseId: string }>()
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()

  const { mutateAsync: deleteIntegration } = useDeleteIntegrationMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { data: integrationData, isFetching: _isFetchingIntegration } =
    useGetIntegration({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: isAdded && ['Fireflies', 'GitHub', 'AWS'].includes(name),
      variables: {
        pulseId,
        type: integrationType as 'fireflies' | 'github' | 'aws',
        userId: user?.id,
      },
    })

  const deleteIntegrationHandler = async () => {
    const integrationId = integrationData?.integration.id
    if (!integrationId) {
      toast.error('No integration ID found')
      return
    }

    try {
      setIsDeleting(true)
      await deleteIntegration({ integrationId })
      await queryClient.invalidateQueries({
        queryKey: ['integration', pulseId, user?.id, integrationType],
      })
      queryClient.invalidateQueries({
        queryKey: ['integrations', pulseId, user?.id],
      }),
        toast.success('Successfully removed integration!')
    } catch (err) {
      toast.error('Failed to remove integration')
      console.error('Deleting integration failed:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Stack
      alignItems="center"
      border="1px solid"
      borderColor="divider"
      borderRadius={1}
      direction="row"
      justifyContent="space-between"
      mb={2}
      p={2}
    >
      <Stack alignItems="center" direction="row" spacing={2}>
        <img
          alt={`${name} logo`}
          src={logo}
          style={{ height: 40, width: 40 }}
        />
        <Typography fontSize={18} fontWeight={500}>
          {name}
        </Typography>
      </Stack>

      {isDeleting ? (
        <LoadingSpinner padding={1} size={24} />
      ) : isLoading ? (
        <LoadingSkeleton height={36} width={65} />
      ) : (
        <Stack
          direction="row"
          divider={<Divider flexItem={true} orientation="vertical" />}
          spacing={1}
        >
          <Button
            disabled={
              isLoading || !['Fireflies', 'GitHub', 'AWS'].includes(name)
            }
            onClick={() =>
              isAdded ? deleteIntegrationHandler() : onAddApiKey()
            }
            startIcon={
              isAdded ? (
                <Clear fontSize="small" />
              ) : (
                <AddIcon fontSize="small" />
              )
            }
            sx={{
              color: theme.palette.error.light,
              ...(isAdded && {
                '&:hover': {
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                },
              }),
            }}
          >
            {isAdded ? t('remove') : t('add')}
          </Button>
          {isAdded && name === 'Fireflies' && (
            <Button onClick={onViewWebhookUrl}>
              {t('view_webhook', { ns: 'sources' })}
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  )
}
