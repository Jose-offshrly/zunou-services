import { OrganizationUser } from '@zunou-graphql/core/graphql'
import { createContext, useContext, useState } from 'react'

interface DirectMessagesContextType {
  activeUser?: OrganizationUser | null
  activeUserId: string | null
  setActiveUser: React.Dispatch<
    React.SetStateAction<OrganizationUser | null | undefined>
  >
  setActiveUserId: (id: string | null) => void
}

const DirectMessagesContext = createContext<DirectMessagesContextType>({
  activeUser: null,
  activeUserId: null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setActiveUser: () => null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setActiveUserId: () => {},
})

export const DirectMessagesProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [activeUser, setActiveUser] = useState<
    OrganizationUser | null | undefined
  >(null)

  return (
    <DirectMessagesContext.Provider
      value={{ activeUser, activeUserId, setActiveUser, setActiveUserId }}
    >
      {children}
    </DirectMessagesContext.Provider>
  )
}

export const useDirectMessages = () => useContext(DirectMessagesContext)
