import { Stack } from '@mui/material'
import { AiAgent } from '@zunou-graphql/core/graphql'
import { useTranslation } from 'react-i18next'

import { LoadingSkeletonRows } from '~/components/ui/LoadingSkeletonRows'
import { NoDataText } from '~/components/ui/NoDataText'
import { useAgentContext } from '~/context/AgentContext'

import { AgentCard } from './AgentCard'

interface AgentListProps {
  agents: AiAgent[]
  isLoading: boolean
  onAgentClick: () => void
  onAgentRemove: (id: string) => void
}

export const AgentList = ({
  agents,
  isLoading,
  onAgentClick,
  onAgentRemove,
}: AgentListProps) => {
  const { t } = useTranslation()
  const { setAgentDetailId } = useAgentContext()

  const handleSelect = (id: string) => {
    onAgentClick()
    setAgentDetailId(id)
  }

  return (
    <Stack flex={1} minHeight={0} overflow="auto" spacing={1}>
      {isLoading ? (
        <LoadingSkeletonRows rowHeight={112} rows={4} />
      ) : agents.length === 0 ? (
        <Stack
          alignItems="center"
          height="100%"
          justifyContent="center"
          width="100%"
        >
          <NoDataText text={t('no_data')} />
        </Stack>
      ) : (
        agents.map((agent) => (
          <AgentCard
            agent={agent}
            key={agent.id}
            onRemove={onAgentRemove}
            onSelect={handleSelect}
          />
        ))
      )}
    </Stack>
  )
}
