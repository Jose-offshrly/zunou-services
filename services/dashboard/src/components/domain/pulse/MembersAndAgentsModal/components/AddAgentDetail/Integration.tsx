import { Stack, TextField, Typography } from '@mui/material'
import { AiAgentType } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form'
import { Control, UseFormRegister, UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { AgentFormData } from '~/context/AgentContext'
import { CreateAiAgentParams } from '~/schemas/CreateAiAgentSchema'

interface IntegrationProps {
  agent: AgentFormData
  register: UseFormRegister<CreateAiAgentParams>
  setValue: UseFormSetValue<CreateAiAgentParams>
  control?: Control<CreateAiAgentParams>
}

export const Integration = ({
  agent,
  register,
  setValue,
}: IntegrationProps) => {
  const { t } = useTranslation(['common', 'agent'])
  const isJiraAgent = agent.agentType === AiAgentType.Jira

  const handleRemoveKey = () => {
    setValue('credentials.key', '')
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography fontWeight="bold" variant="h6">
          {t('integration')}
        </Typography>
        <Typography color="text.secondary">
          {isJiraAgent
            ? t('jira_integration_description', { ns: 'agent' })
            : t('integration_description', { ns: 'agent' })}
        </Typography>
      </Stack>

      {isJiraAgent && (
        <Stack spacing={0.5}>
          <Typography fontWeight="bold">
            {t('username_or_email', { ns: 'agent' })}
          </Typography>
          <TextField
            fullWidth={true}
            {...register('credentials.username')}
            placeholder={t('type_your_username_or_email_here', { ns: 'agent' })}
            size="small"
          />
        </Stack>
      )}

      <Stack spacing={0.5}>
        <Typography fontWeight="bold">
          {isJiraAgent ? '' : 'API Key'}
        </Typography>
        {/* {isJiraAgent ? (
          <Button
            disabled={isAuthenticating || isJiraConnected}
            onClick={onConnectToJira}
            size="small"
            sx={{
              gap: 1,
              width: '20%',
              ...(isJiraConnected && {
                '&:hover': {
                  backgroundColor: 'transparent',
                  borderColor: 'success.main',
                },
                borderColor: 'success.main',
                color: 'success.main',
              }),
            }}
            variant={isJiraConnected ? 'outlined' : 'contained'}
          >
            {isJiraConnected ? (
              <CheckCircleOutlined sx={{ color: 'success.main' }} />
            ) : (
              <LinkOutlined />
            )}
            {isAuthenticating
              ? t('connecting', { ns: 'common' })
              : isJiraConnected
                ? t('connected', { ns: 'common' })
                : t('connect_to_jira', { ns: 'agent' })}
          </Button>
        ) : ( */}
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth={true}
            {...register('credentials.key')}
            placeholder="API Key"
            size="small"
          />
          <Button onClick={handleRemoveKey} size="small" variant="outlined">
            {t('remove')}
          </Button>
        </Stack>
        {/* )} */}
      </Stack>
    </Stack>
  )
}
