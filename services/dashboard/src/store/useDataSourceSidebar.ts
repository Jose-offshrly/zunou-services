import { create } from 'zustand'

interface DataSourceSidebarState {
  isCollapsed: boolean
  setIsCollapsed: (isCollapsed: boolean) => void
}

export const useDataSourceSidebar = create<DataSourceSidebarState>((set) => ({
  isCollapsed: false,
  setIsCollapsed: (isCollapsed: boolean) => set({ isCollapsed }),
}))
