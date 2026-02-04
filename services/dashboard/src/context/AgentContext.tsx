import { AiAgent, AiAgentType } from '@zunou-graphql/core/graphql'
import { createContext, ReactNode, useContext, useState } from 'react'

export type AgentFormData = Partial<AiAgent> & {
  name: string
  description: string | null
  agentType: AiAgentType
}

interface AgentContextType {
  selectedAgent: AiAgent | null
  setSelectedAgent: React.Dispatch<React.SetStateAction<AiAgent | null>>
  agentDetailId: string | null
  setAgentDetailId: React.Dispatch<React.SetStateAction<string | null>>
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  addAgent: AgentFormData | null
  setAddAgent: React.Dispatch<React.SetStateAction<AgentFormData | null>>
}

interface AgentProviderProps {
  children: ReactNode
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

export const useAgentContext = (): AgentContextType => {
  const context = useContext(AgentContext)
  if (!context) {
    throw new Error('useAgentContext must be used within an AgentProvider')
  }
  return context
}

export const AgentProvider = ({ children }: AgentProviderProps) => {
  const [agentDetailId, setAgentDetailId] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<AiAgent | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [addAgent, setAddAgent] = useState<AgentFormData | null>(null)

  return (
    <AgentContext.Provider
      value={{
        addAgent,
        agentDetailId,
        loading,
        selectedAgent,
        setAddAgent,
        setAgentDetailId,
        setLoading,
        setSelectedAgent,
      }}
    >
      {children}
    </AgentContext.Provider>
  )
}
