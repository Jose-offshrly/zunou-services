import { createContext, ReactNode, useContext, useState } from 'react'

interface IntegrationContextType {
  currentView: string | null
  setCurrentView: React.Dispatch<React.SetStateAction<string | null>>
}

interface IntegrationProviderProps {
  children: ReactNode
  coreGraphqlUrl: string
}

const IntegrationContext = createContext<IntegrationContextType | undefined>(
  undefined,
)

export const useIntegrationContext = (): IntegrationContextType => {
  const context = useContext(IntegrationContext)
  if (!context) {
    throw new Error(
      'useIntegrationContext must be used within an IntegrationProvider',
    )
  }
  return context
}

export const IntegrationProvider = ({ children }: IntegrationProviderProps) => {
  const [currentView, setCurrentView] = useState<string | null>(null)

  return (
    <IntegrationContext.Provider
      value={{
        currentView,
        setCurrentView,
      }}
    >
      {children}
    </IntegrationContext.Provider>
  )
}
