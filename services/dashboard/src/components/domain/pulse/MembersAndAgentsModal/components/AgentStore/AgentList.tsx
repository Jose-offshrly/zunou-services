import { Box } from '@mui/material'

import { AgentFormData } from '~/context/AgentContext'
import { aiAgents } from '~/libs/aiAgents'

import { AgentCard } from './AgentCard'

interface AgentListProps {
  onSelect: (agent: AgentFormData) => void
}

export const AgentList = ({ onSelect }: AgentListProps) => {
  return (
    <Box
      sx={{
        display: 'grid',
        flex: 1,
        gap: 2,
        gridTemplateColumns: 'repeat(2, 1fr)',
        minHeight: 0,
        overflow: 'auto',
        width: '100%',
      }}
    >
      {aiAgents.map((agent, index) => (
        <Box key={index}>
          <AgentCard agent={agent} onAdd={onSelect} />
        </Box>
      ))}
    </Box>
  )
}
