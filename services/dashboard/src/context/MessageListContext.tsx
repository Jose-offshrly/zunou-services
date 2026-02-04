import { createContext, useContext, useState } from 'react'

interface EditingContextType {
  currentEditingId: string | null
  setCurrentEditingId: (id: string | null) => void
}

const EditingContext = createContext<EditingContextType>({
  currentEditingId: null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setCurrentEditingId: () => {},
})

export const EditingProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [currentEditingId, setCurrentEditingId] = useState<string | null>(null)

  return (
    <EditingContext.Provider value={{ currentEditingId, setCurrentEditingId }}>
      {children}
    </EditingContext.Provider>
  )
}

export const useEditing = () => useContext(EditingContext)
