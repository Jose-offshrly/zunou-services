import { User } from '@zunou-graphql/core/graphql'
import { create } from 'zustand'

declare global {
  interface Window {
    unreadCount: number
  }
}

interface TeamState {
  isOpen: boolean
  url: string
  selectedMember: User | null
  openModal: (member: User) => void
  closeModal: () => void
  setSelectedMember: (member: User | null) => void

  unreadCounts: Record<string, number>
  totalUnread: number
  setUnreadCount: (key: string, count: number) => void
}

export const useTeamStore = create<TeamState>((set) => ({
  closeModal: () => set({ isOpen: false, selectedMember: null }),
  isOpen: false,
  openModal: (member) => set({ isOpen: true, selectedMember: member }),
  selectedMember: null,
  setSelectedMember: (member) => set({ selectedMember: member }),
  setUnreadCount: (key, count) =>
    set((state) => {
      const updatedCounts = { ...state.unreadCounts, [key]: count }
      const total = Object.values(updatedCounts).reduce((a, b) => a + b, 0)

      window.unreadCount = total
      return { totalUnread: total, unreadCounts: updatedCounts }
    }),
  totalUnread: 0,
  unreadCounts: {},
  url: '',
}))
