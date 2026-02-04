import { zodResolver } from '@hookform/resolvers/zod'
import {
  DescriptionOutlined,
  IntegrationInstructionsOutlined,
  SettingsOutlined,
  TuneOutlined,
} from '@mui/icons-material'
import { alpha, Icon, Stack, Typography } from '@mui/material'
import { useGetAiAgentQuery } from '@zunou-queries/core/hooks/useGetAiAgentQuery'
import { useUpdateAiAgentMutation } from '@zunou-queries/core/hooks/useUpdateAiAgentMutation'
import { Button, Form, LoadingButton } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { useAgentContext } from '~/context/AgentContext'
import { useOrganization } from '~/hooks/useOrganization'
import {
  UpdateAiAgentParams,
  updateAiAgentSchema,
} from '~/schemas/UpdateAiAgentSchema'
import { toTitleCase } from '~/utils/toTitleCase'

import { Documentation } from './Documentation'
import { General } from './General'
import { Integration } from './Integration'
import { Settings } from './Settings'

enum TabIdentifier {
  GENERAL = 'general',
  INTEGRATION = 'integration',
  SETTINGS = 'settings',
  DOCUMENTATION = 'documentation',
}

const getIcon = (id: TabIdentifier) => {
  switch (id) {
    case TabIdentifier.GENERAL:
      return SettingsOutlined
    case TabIdentifier.INTEGRATION:
      return IntegrationInstructionsOutlined
    case TabIdentifier.SETTINGS:
      return TuneOutlined
    case TabIdentifier.DOCUMENTATION:
      return DescriptionOutlined
    default:
      return TuneOutlined
  }
}

interface Props {
  onBack: () => void
  agentId: string
}

export const AgentDetail = ({ onBack, agentId }: Props) => {
  const { t } = useTranslation(['common', ' agent'])
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const { setSelectedAgent } = useAgentContext()
  const [activeTab, setActiveTab] = useState<TabIdentifier>(
    TabIdentifier.GENERAL,
  )

  const tabs = Object.values(TabIdentifier).map((value) => ({
    icon: getIcon(value),
    id: value,
    label: toTitleCase(t(value)),
  }))

  const { data: agentData, isLoading: isLoadingAiAgent } = useGetAiAgentQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      aiAgentId: agentId,
      organizationId,
      pulseId,
    },
  })
  const agent = agentData?.aiAgent

  const { mutate: updateAiAgent, isPending: isUpdatingAiAgent } =
    useUpdateAiAgentMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const {
    handleSubmit,
    reset,
    register,
    setValue,
    formState: { isValid },
  } = useForm<UpdateAiAgentParams>({
    defaultValues: {
      credentials: agent?.credentials,
      description: agent?.description,
      guidelines: agent?.guidelines,
      name: agent?.name,
    },
    resolver: zodResolver(updateAiAgentSchema),
  })

  useEffect(() => {
    if (agent) {
      reset({
        credentials: agent.credentials,
        description: agent.description,
        guidelines: agent.guidelines,
        name: agent.name,
      })
    }
  }, [agent, reset])

  useEffect(() => {
    if (agent) {
      setSelectedAgent(agent)
    }
  }, [agentData, setSelectedAgent])

  const onSubmit = (data: UpdateAiAgentParams) => {
    updateAiAgent(
      {
        id: agentId,
        organizationId,
        ...data,
      },
      {
        onError: (error) => {
          toast.error(t('update_agent_error', { ns: 'agent' }))
          console.error('Failed to update agent: ' + error.message)
        },
        onSuccess: () => {
          toast.success(t('update_agent_success', { ns: 'agent' }))
          onBack()
          reset()
        },
      },
    )
  }

  const renderTabContent = () => {
    if (isLoadingAiAgent) {
      return <LoadingSpinner />
    }

    if (!agent) return null

    switch (activeTab) {
      case TabIdentifier.GENERAL:
        return <General agent={agent} register={register} />
      case TabIdentifier.INTEGRATION:
        return (
          <Integration agent={agent} register={register} setValue={setValue} />
        )
      case TabIdentifier.SETTINGS:
        return (
          <Settings agent={agent} register={register} setValue={setValue} />
        )
      case TabIdentifier.DOCUMENTATION:
        return <Documentation />
      default:
        return null
    }
  }

  return (
    <Stack direction="row" flex={1} spacing={2}>
      <Stack spacing={1}>
        {tabs.map(({ id, icon, label }, index) => (
          <Button
            key={index}
            onClick={() => setActiveTab(id)}
            startIcon={<Icon component={icon} fontSize="small" />}
            sx={{
              alignItems: 'start',
              bgcolor:
                activeTab === id ? alpha(theme.palette.primary.main, 0.1) : '',
              color: 'text.primary',
              justifyContent: 'start',
              paddingX: 1.5,
              paddingY: 1,
              textTransform: 'none',
            }}
          >
            <Typography fontSize={14} fontWeight={4}>
              {label}
            </Typography>
          </Button>
        ))}
      </Stack>

      <Form
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          display: 'flex',
          flex: 1,
          justifyContent: 'space-between',
          maxWidth: 'none',
          padding: 0,
          width: '100%',
        }}
      >
        {renderTabContent()}
        <Stack direction="row" justifyContent="end" spacing={1}>
          <Button
            color="inherit"
            disableElevation={true}
            onClick={onBack}
            type="button"
          >
            {t('cancel')}
          </Button>
          <LoadingButton
            disableElevation={true}
            disabled={!isValid}
            loading={isUpdatingAiAgent}
            type="submit"
            variant="contained"
          >
            {t('update_and_continue')}
          </LoadingButton>
        </Stack>
      </Form>
    </Stack>
  )
}
