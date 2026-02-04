import { Box, Stack, TextField, Typography } from '@mui/material'
import { UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { AgentFormData } from '~/context/AgentContext'
import { CreateAiAgentParams } from '~/schemas/CreateAiAgentSchema'

import { agentTypeIcons } from '../AgentStore/AgentCard'
interface Props {
  agent: AgentFormData
  register: UseFormRegister<CreateAiAgentParams>
}

export const General = ({ agent, register }: Props) => {
  const { t } = useTranslation(['common', 'agent'])
  const avatarSrc = agentTypeIcons[agent.agentType]

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography fontWeight="bold" variant="h6">
          {t('general')}
        </Typography>
        <Typography color="text.secondary">{agent?.description}</Typography>
      </Stack>
      <Stack alignItems="center" direction="row" spacing={1}>
        <Box width={100}>
          <Typography fontWeight="bold" variant="body1">
            {t('avatar')}
          </Typography>
        </Box>
        <img alt={agent.agent_type} height={40} src={avatarSrc} width={40} />
      </Stack>
      <Stack direction="row" spacing={1}>
        <Box width={100}>
          <Typography fontWeight="bold" variant="body1">
            {t('name')}
          </Typography>
        </Box>
        <TextField size="small" {...register('name')} />
      </Stack>
      <Stack spacing={0.5}>
        <Typography fontWeight="bold" variant="body1">
          {t('guidelines')}
        </Typography>
        <TextField
          {...register('guidelines')}
          multiline={true}
          placeholder={t('agent_guidelines_placeholder', { ns: 'agent' })}
          rows={3}
        />
      </Stack>
    </Stack>
  )
}
