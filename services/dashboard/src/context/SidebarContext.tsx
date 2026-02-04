import { createContext, ReactNode, useContext, useState } from 'react'

import { BackgroundColorEnum, BackgroundColorType } from '../types/background'

interface SidebarContextType {
  backgroundColor: BackgroundColorType
  updateSidebarColor: (newColor: BackgroundColorType) => void
}

interface SidebarProviderProps {
  children: ReactNode
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const useSidebarContext = (): SidebarContextType => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebarContext must be used within an SidebarProvider')
  }
  return context
}

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const [backgroundColor, setBackgroundColor] = useState<BackgroundColorType>(
    BackgroundColorEnum.WHITE,
  )

  const updateSidebarColor = (newColor: BackgroundColorType) => {
    setBackgroundColor(newColor)
  }

  return (
    <SidebarContext.Provider
      value={{
        backgroundColor,
        updateSidebarColor,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}
