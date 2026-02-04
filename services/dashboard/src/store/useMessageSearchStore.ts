import { create } from 'zustand'

interface MessageSearchState {
  query: string | null
  setQuery: (query: string | null) => void
  showResults: boolean
  setShowResults: (showResults: boolean) => void
}

export const useMessageSearchStore = create<MessageSearchState>((set) => ({
  query: null,
  setQuery: (query: string | null) => set({ query }),
  setShowResults: (showResults: boolean) => set({ showResults }),
  showResults: false,
}))
