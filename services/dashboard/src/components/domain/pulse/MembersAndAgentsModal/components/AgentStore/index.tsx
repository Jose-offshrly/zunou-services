import { ChevronLeft, FilterAltOutlined } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import { Button } from '@zunou-react/components/form'
import { useTranslation } from 'react-i18next'

import { AgentFormData, useAgentContext } from '~/context/AgentContext'

import { FilterSelector } from '../AgentsTab/FilterSelector'
import { SearchBar } from '../SearchBar'
import { AgentList } from './AgentList'

interface AgentStoreProps {
  onBack: () => void
  onAddAgent: () => void
}

const AgentStore = ({ onAddAgent, onBack }: AgentStoreProps) => {
  const { t } = useTranslation(['common', 'agent'])
  const { setAddAgent } = useAgentContext()

  const handleAddAgent = (agent: AgentFormData) => {
    setAddAgent(agent)
    onAddAgent()
  }

  return (
    <Stack flex={1} minHeight={0} spacing={1.5}>
      <Button
        color="inherit"
        onClick={onBack}
        startIcon={<ChevronLeft fontSize="small" />}
        sx={{
          alignSelf: 'flex-start',
        }}
      >
        {t('back')}
      </Button>
      <Typography fontWeight="bold" variant="h6">
        {t('add_ai_agents', { ns: 'agent' })}
      </Typography>
      <Stack direction="row" spacing={1}>
        <SearchBar
          onSearchChange={() => null}
          placeholder={t('search_ai_agents', { ns: 'agent' })}
          searchTerm=""
        />
        <Stack alignItems="center" direction="row" spacing={1}>
          <FilterAltOutlined />
          <Typography>{t('filter')}</Typography>
          <FilterSelector value="all" />
        </Stack>
      </Stack>

      {/* Agent List */}
      <AgentList onSelect={handleAddAgent} />
    </Stack>
  )
}

export default AgentStore
