import { Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import { AiAgentType } from '@zunou-graphql/core/graphql'
import githubIcon from '@zunou-react/assets/images/github-icon.png'
import jiraIcon from '@zunou-react/assets/images/jira-icon.png'
import slackIcon from '@zunou-react/assets/images/slack-icon.png'
import { Button } from '@zunou-react/components/form'
import { useTranslation } from 'react-i18next'

import { AgentFormData } from '~/context/AgentContext'

interface AgentCardProps {
  onAdd: (agent: AgentFormData) => void
  agent: AgentFormData
}

export const agentTypeIcons: Partial<Record<AiAgentType, string>> = {
  GITHUB: githubIcon,
  JIRA: jiraIcon,
  SLACK: slackIcon,
}

export const AgentCard = ({ agent, onAdd }: AgentCardProps) => {
  const { t } = useTranslation()

  const avatarSrc = agentTypeIcons[agent.agentType]
  return (
    <Card
      sx={{ height: '100%', minHeight: 'fit-content', position: 'relative' }}
      variant="outlined"
    >
      <CardContent
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'row',
          gap: 2,
          height: '100%',
          pr: 10,
        }}
      >
        <Stack spacing={1}>
          <Stack direction="row" spacing={1}>
            <img
              alt={agent?.agentType}
              height={24}
              src={avatarSrc}
              width={24}
            />
            <Typography>{agent.name}</Typography>
          </Stack>
          <Typography color="text.secondary" variant="body2">
            {agent.description}
          </Typography>
          <Stack alignItems="center" direction="row" spacing={1}>
            <Typography variant="body2">Sales Force</Typography>
            <Chip color="primary" label="Zunou AI" variant="outlined" />
          </Stack>
        </Stack>
      </CardContent>
      <Button
        onClick={() => onAdd(agent)}
        size="small"
        sx={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1,
        }}
        variant="contained"
      >
        {t('add')}
      </Button>
    </Card>
  )
}
