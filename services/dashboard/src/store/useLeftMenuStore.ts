import { create } from 'zustand'

interface LeftMenuState {
  isExpanded: boolean
  setIsExpanded: (isExpanded: boolean) => void
  isDragging: boolean
  setIsDragging: (isDragging: boolean) => void
}

export const useLeftMenuStore = create<LeftMenuState>((set) => ({
  isDragging: false,
  isExpanded: true,

  setIsDragging: (isDragging: boolean) => set({ isDragging }),
  setIsExpanded: (isExpanded: boolean) => set({ isExpanded }),
}))
