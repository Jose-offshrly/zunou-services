import { Stack, TextField, Typography } from '@mui/material'
import { AiAgent, AiAgentType } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form'
import { UseFormRegister, UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { UpdateAiAgentParams } from '~/schemas/UpdateAiAgentSchema'

interface SettingsProps {
  agent: AiAgent
  register: UseFormRegister<UpdateAiAgentParams>
  setValue: UseFormSetValue<UpdateAiAgentParams>
}

export const Settings = ({ agent, register, setValue }: SettingsProps) => {
  const { t } = useTranslation(['common', 'agent'])
  const isJiraAgent = agent.agent_type === AiAgentType.Jira

  const handleChangeLink = () => {
    setValue('credentials.workspace', '', { shouldValidate: true })
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography fontWeight="bold" variant="h6">
          {t('settings')}
        </Typography>
        <Typography color="text.secondary">
          {t('settings_description', { ns: 'agent' })}
        </Typography>
      </Stack>
      <Stack spacing={0.5}>
        <Typography fontWeight="bold">
          {t('workspace_link', { ns: 'agent' })}
        </Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            {...register('credentials.workspace')}
            fullWidth={true}
            placeholder={
              isJiraAgent
                ? 'Jira Workspace Link'
                : t('agent_settings_placeholder', { ns: 'agent' })
            }
            size="small"
          />
          <Button onClick={handleChangeLink} size="small" variant="outlined">
            {t('change')}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  )
}
