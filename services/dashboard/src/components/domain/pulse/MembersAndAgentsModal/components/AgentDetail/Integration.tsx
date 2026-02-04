import { Stack, TextField, Typography } from '@mui/material'
import { AiAgent, AiAgentType } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form'
import { UseFormRegister, UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { UpdateAiAgentParams } from '~/schemas/UpdateAiAgentSchema'

interface IntegrationProps {
  agent: AiAgent
  register: UseFormRegister<UpdateAiAgentParams>
  setValue: UseFormSetValue<UpdateAiAgentParams>
}

export const Integration = ({
  agent,
  register,
  setValue,
}: IntegrationProps) => {
  const { t } = useTranslation(['common', 'agent'])
  const isJiraAgent = agent.agent_type === AiAgentType.Jira

  const handleRemoveKey = () => {
    setValue('credentials.key', '', { shouldValidate: true })
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
          <Typography fontWeight="bold">Name</Typography>
          <TextField
            fullWidth={true}
            {...register('credentials.name')}
            placeholder="My Jira Workspace"
            size="small"
          />
        </Stack>
      )}

      <Stack spacing={0.5}>
        <Typography fontWeight="bold">API Key</Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            {...register('credentials.key')}
            fullWidth={true}
            placeholder="API Key"
            size="small"
          />
          <Button onClick={handleRemoveKey} size="small" variant="outlined">
            {t('remove')}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  )
}
