import { zodResolver } from '@hookform/resolvers/zod'
import {
  DescriptionOutlined,
  IntegrationInstructionsOutlined,
  SettingsOutlined,
  TuneOutlined,
} from '@mui/icons-material'
import { alpha, Icon, Stack, Typography } from '@mui/material'
import { AiAgentType } from '@zunou-graphql/core/graphql'
import { useCreateAiAgentMutation } from '@zunou-queries/core/hooks/useCreateAiAgentMutation'
import { Button, Form, LoadingButton } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { useAgentContext } from '~/context/AgentContext'
import { useOrganization } from '~/hooks/useOrganization'
import {
  CreateAiAgentParams,
  createAiAgentSchema,
} from '~/schemas/CreateAiAgentSchema'
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

const tabSteps = Object.values(TabIdentifier)

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

export const AddAgentDetail = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation(['common', 'agent'])
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const { addAgent } = useAgentContext()

  const [addAgentStep, setAddAgentStep] = useState(0)
  const [activeTab, setActiveTab] = useState<TabIdentifier>(tabSteps[0])

  // Removed old Jira OAuth state variables
  // const [isJiraConnected, setIsJiraConnected] = useState(false)
  // const [isAuthenticating, setIsAuthenticating] = useState(false)
  // const popupRef = useRef<Window | null>(null)
  // const authStateRef = useRef<string | null>(null)
  // const processingStateRef = useRef<string | null>(null)

  const tabs = Object.values(TabIdentifier).map((value) => ({
    icon: getIcon(value),
    label: toTitleCase(t(value)),
    value,
  }))

  const {
    control,
    handleSubmit,
    reset,
    register,
    setValue,
    getValues,
    formState: { isValid },
  } = useForm<CreateAiAgentParams>({
    defaultValues: {
      agentType: addAgent?.agentType,
      credentials: addAgent?.credentials,
      description: addAgent?.description,
      guidelines: addAgent?.guidelines,
      name: addAgent?.name,
    },
    mode: 'onBlur',
    resolver: zodResolver(createAiAgentSchema),
  })

  const { credentials } = useWatch({ control })

  const isIntegrationStep =
    addAgentStep === tabSteps.indexOf(TabIdentifier.INTEGRATION)
  const isSettingsStep =
    addAgentStep === tabSteps.indexOf(TabIdentifier.SETTINGS)

  const isValidIntegrationStep = !isIntegrationStep || credentials?.['key']
  const isValidSettingsStep = !isSettingsStep || credentials?.['workspace']

  const isFinalStep = addAgentStep >= tabSteps.indexOf(TabIdentifier.SETTINGS)

  const handleTabChange = (tab: TabIdentifier) => {
    const index = tabSteps.indexOf(tab)

    if (index <= addAgentStep) {
      setActiveTab(tab)
    }
  }

  const nextStep = () => {
    setAddAgentStep((prevStep) => {
      const nextStep = prevStep + 1
      const clampedNextStep = Math.min(nextStep, tabSteps.length - 1)

      if (clampedNextStep > prevStep) {
        setActiveTab(tabSteps[clampedNextStep])
      }

      return clampedNextStep
    })
  }

  const { mutate: createAiAgent, isPending: isCreatingAgent } =
    useCreateAiAgentMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  // useEffect(() => {
  //   if (credentials && addAgent?.agentType === AiAgentType.Jira) {
  //     const hasJiraTokens = credentials.key && credentials.projectId
  //     setIsJiraConnected(!!hasJiraTokens)
  //   }
  // }, [credentials, addAgent?.agentType])

  // const handleConnectToJira = async () => {
  //   try {
  //     setIsAuthenticating(true)

  //     const result = await startMCPAuth.mutateAsync({
  //       mcpServer: McpServer.Jira,
  //       redirectUri: `${window.location.origin}/auth/callback`,
  //     })

  //     const { authUrl, state } = result.startMCPAuthorization

  //     if (authUrl) {
  //       authStateRef.current = state

  //       const popup = window.open(
  //         authUrl,
  //         'jira-auth',
  //         'width=500,height=600,scrollbars=yes,resizable=yes',
  //       )

  //       if (popup) {
  //         popupRef.current = popup

  //         popup.focus()
  //       } else {
  //         throw new Error(
  //           'Failed to open popup window. Please allow popups for this site.',
  //         )
  //       }
  //     } else {
  //       throw new Error('No authorization URL received')
  //     }
  //   } catch (error) {
  //     console.error('Failed to start MCP authorization:', error)
  //     toast.error(
  //       error instanceof Error
  //         ? error.message
  //         : 'Failed to start authentication',
  //     )
  //     setIsAuthenticating(false)
  //   }
  // }

  // const startMCPAuth = useStartMCPAuthorization({
  //   coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  // })

  // const completeMCPAuth = useCompleteMCPAuthorization({
  //   coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  // })

  // useEffect(() => {
  //   const handleMessage = async (event: MessageEvent) => {
  //     if (event.origin !== window.location.origin) return

  //     if (event.data?.type === 'MCP_AUTH_CALLBACK') {
  //       const { code, state, error } = event.data

  //       if (processingStateRef.current === state) {
  //         return
  //       }

  //       if (popupRef.current) {
  //         popupRef.current.close()
  //         popupRef.current = null
  //       }

  //       if (error) {
  //         toast.error('Authentication failed. Please try again.')
  //         setIsAuthenticating(false)
  //         processingStateRef.current = null
  //         return
  //       }

  //       if (state !== authStateRef.current) {
  //         toast.error('Authentication state mismatch. Please try again.')
  //         setIsAuthenticating(false)
  //         processingStateRef.current = null
  //         return
  //       }

  //       processingStateRef.current = state

  //       try {
  //         const result = await completeMCPAuth.mutateAsync({
  //           code,
  //           state,
  //         })

  //         if (result.completeMCPAuthorization.success) {
  //           const tokenData = result.completeMCPAuthorization.tokenData

  //           if (tokenData) {
  //             const expiresAt = tokenData.expiresIn
  //               ? Date.now() + tokenData.expiresIn * 1000
  //               : Date.now() + 3600 * 1000

  //             const jiraCredentials = {
  //               access_token: tokenData.accessToken,
  //               client_id: '7oBI2IwNkvToHtz5',
  //               expires_at: expiresAt,
  //               mcp_server: 'https://mcp.atlassian.com/v1/sse',
  //               provider: 'jira',
  //               refresh_token: tokenData.refreshToken || '',
  //               token_endpoint:
  //                 'https://atlassian-remote-mcp-production.atlassian-remote-mcp-server-production.workers.dev/v1/token',
  //             }

  //             setValue('credentials.key', JSON.stringify(jiraCredentials))
  //             setValue('credentials.projectId', 'default')

  //             setIsJiraConnected(true)
  //             toast.success('Successfully connected to Jira!')
  //             processingStateRef.current = null
  //           } else {
  //             throw new Error('No token data received')
  //           }
  //         } else {
  //           throw new Error(
  //             result.completeMCPAuthorization.message || 'Authorization failed',
  //           )
  //         }
  //       } catch (error) {
  //         toast.error('Failed to complete authentication. Please try again.')
  //       } finally {
  //         setIsAuthenticating(false)
  //         processingStateRef.current = null
  //       }
  //     }
  //   }

  //   window.addEventListener('message', handleMessage)
  //   return () => window.removeEventListener('message', handleMessage)
  // }, [completeMCPAuth, setValue])

  const onSubmit = (data: CreateAiAgentParams) => {
    if (!pulseId || !organizationId) return

    const { agentType, ...rest } = data

    // Updated credentials handling to follow GitHub/Slack pattern
    let credentials = {}
    const key = getValues('credentials.key')
    const username = getValues('credentials.username')
    const workspace = getValues('credentials.workspace')

    if (key) {
      if (agentType === AiAgentType.Jira && username && workspace) {
        credentials = { key, username, workspace }
      } else if (agentType === AiAgentType.Github && workspace) {
        credentials = { key, workspace }
      } else if (agentType === AiAgentType.Slack && workspace) {
        credentials = { key, workspace }
      } else {
        credentials = { key }
      }
    }

    createAiAgent(
      {
        ...rest,
        agent_type: agentType,
        credentials,
        organizationId,
        pulseId,
      },
      {
        onError: () => {
          toast.error(t('create_agent_error', { ns: 'agent' }))
        },
        onSuccess: () => {
          toast.success(t('create_agent_success', { ns: 'agent' }))
          onBack()
          reset()
        },
      },
    )
  }

  const renderTabContent = () => {
    if (!addAgent) return null

    switch (activeTab) {
      case TabIdentifier.GENERAL:
        return <General agent={addAgent} register={register} />
      case TabIdentifier.INTEGRATION:
        return (
          <Integration
            agent={addAgent}
            control={control}
            register={register}
            setValue={setValue}
          />
        )
      case TabIdentifier.SETTINGS:
        return (
          <Settings agent={addAgent} register={register} setValue={setValue} />
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
        {tabs.map(({ value, icon, label }, index) => (
          <Button
            disabled={index > addAgentStep}
            key={index}
            onClick={() => handleTabChange(value)}
            startIcon={<Icon component={icon} fontSize="small" />}
            sx={{
              alignItems: 'start',
              bgcolor:
                activeTab === value
                  ? alpha(theme.palette.primary.main, 0.1)
                  : '',
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

          {isFinalStep ? (
            <LoadingButton
              disabled={!isValid}
              loading={isCreatingAgent}
              onClick={handleSubmit(onSubmit)}
              variant="contained"
            >
              {t('add_agent', { ns: 'agent' })}
            </LoadingButton>
          ) : (
            <LoadingButton
              disabled={!isValidIntegrationStep || !isValidSettingsStep}
              loading={isCreatingAgent}
              onClick={nextStep}
              variant="contained"
            >
              {t('next')}
            </LoadingButton>
          )}
        </Stack>
      </Form>
    </Stack>
  )
}
