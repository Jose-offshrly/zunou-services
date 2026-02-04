import { createContext, ReactNode, useContext, useState } from 'react'

export enum TabIdentifier {
  CONTENT = 'content',
  MEETINGS = 'meetings',
  INTEGRATIONS = 'integrations',
}

interface DataSourceContextType {
  activeTab: TabIdentifier
  setActiveTab: React.Dispatch<React.SetStateAction<TabIdentifier>>
}

interface DataSourceProviderProps {
  children: ReactNode
}

const DataSourceContext = createContext<DataSourceContextType | undefined>(
  undefined,
)

export const useDataSourceContext = (): DataSourceContextType => {
  const context = useContext(DataSourceContext)
  if (!context) {
    throw new Error(
      'useDataSourceContext must be used within an DataSourceProvider',
    )
  }
  return context
}

export const DataSourceProvider = ({ children }: DataSourceProviderProps) => {
  const [activeTab, setActiveTab] = useState<TabIdentifier>(
    TabIdentifier.CONTENT,
  )

  return (
    <DataSourceContext.Provider
      value={{
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </DataSourceContext.Provider>
  )
}
