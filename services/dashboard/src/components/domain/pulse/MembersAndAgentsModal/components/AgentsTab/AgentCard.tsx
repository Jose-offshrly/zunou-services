import {
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import {
  AiAgent,
  AiAgentType,
  PulseMemberRole,
} from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form'
import { useTranslation } from 'react-i18next'

import { usePulseStore } from '~/store/usePulseStore'
import { withStopPropagation } from '~/utils/withStopPropagation'

import { agentTypeIcons } from '../AgentStore/AgentCard'

interface AgentCardProps {
  agent: AiAgent
  onRemove: (id: string) => void
  onSelect: (agentId: string) => void
}

export const AgentCard = ({ agent, onSelect, onRemove }: AgentCardProps) => {
  const { pulseMembership } = usePulseStore()
  const { t } = useTranslation(['common', 'agent'])
  const { id, agent_type, description, name } = agent
  const isInternal = agent_type === AiAgentType.Zunou

  const avatarSrc = agentTypeIcons[agent.agent_type]

  return (
    <Card
      sx={{ minHeight: 'fit-content', position: 'relative' }}
      variant="outlined"
    >
      <CardActionArea
        onClick={
          pulseMembership?.role !== PulseMemberRole.Guest
            ? () => onSelect(id)
            : undefined
        }
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
          <img alt={agent_type} height={56} src={avatarSrc} width={56} />
          <Stack spacing={1}>
            <Stack alignItems="center" direction="row" spacing={1}>
              <Typography fontWeight="bold" variant="h6">
                {name}
              </Typography>
              <Chip
                color={isInternal ? 'primary' : 'secondary'}
                label={isInternal ? 'Zunou AI' : t('external')}
                variant="outlined"
              />
            </Stack>
            <Typography color="text.secondary" variant="body2">
              {description}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
      {pulseMembership?.role !== PulseMemberRole.Guest && (
        <Button
          onClick={() => withStopPropagation(() => onRemove(id))}
          size="small"
          sx={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
          }}
        >
          {t('remove')}
        </Button>
      )}
    </Card>
  )
}
