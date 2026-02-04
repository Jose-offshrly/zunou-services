import { Stack, TextField, Typography } from '@mui/material'
import { AiAgentType } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form'
import { UseFormRegister, UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { AgentFormData } from '~/context/AgentContext'
import { CreateAiAgentParams } from '~/schemas/CreateAiAgentSchema'

interface SettingsProps {
  agent: AgentFormData
  register: UseFormRegister<CreateAiAgentParams>
  setValue: UseFormSetValue<CreateAiAgentParams>
}

const getWorkspacePlaceholder = (agentType: AiAgentType) => {
  switch (agentType) {
    case AiAgentType.Github:
      return 'Github Repository Link'
    case AiAgentType.Slack:
      return 'Slack Workspace Link'
    case AiAgentType.Jira:
      return 'Jira Workspace Link'
    default:
      return 'Workspace Link'
  }
}

interface CredentialFieldProps {
  fieldName: keyof CreateAiAgentParams['credentials']
  labelKey: string
  placeholder: string
  register: UseFormRegister<CreateAiAgentParams>
  setValue: UseFormSetValue<CreateAiAgentParams>
  t: (key: string, options?: { ns?: string }) => string
}

const CredentialField = ({
  fieldName,
  labelKey,
  placeholder,
  register,
  setValue,
  t,
}: CredentialFieldProps) => {
  const handleChangeLink = () => setValue(`credentials.${fieldName}`, '')

  return (
    <Stack spacing={0.5}>
      <Typography fontWeight="bold">{t(labelKey, { ns: 'agent' })}</Typography>
      <Stack direction="row" spacing={1}>
        <TextField
          {...register(`credentials.${fieldName}`)}
          fullWidth={true}
          placeholder={placeholder}
          size="small"
        />
        <Button onClick={handleChangeLink} size="small" variant="outlined">
          {t('change')}
        </Button>
      </Stack>
    </Stack>
  )
}

export const Settings = ({ register, agent, setValue }: SettingsProps) => {
  const { t } = useTranslation(['common', 'agent'])

  const showWorkspaceField = [
    AiAgentType.Github,
    AiAgentType.Slack,
    AiAgentType.Jira,
  ].includes(agent.agentType)

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

      <Stack spacing={1}>
        {showWorkspaceField && (
          <CredentialField
            fieldName="workspace"
            labelKey="workspace_link"
            placeholder={getWorkspacePlaceholder(agent.agentType)}
            register={register}
            setValue={setValue}
            t={t}
          />
        )}
      </Stack>
    </Stack>
  )
}
