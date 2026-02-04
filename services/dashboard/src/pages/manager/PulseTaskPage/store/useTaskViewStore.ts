import { create } from 'zustand'

export type TaskViewType = 'list' | 'table' | 'calendar' | 'gantt' | 'kanban'

interface TaskViewState {
  currentView: TaskViewType
  setCurrentView: (view: TaskViewType) => void
}

export const useTaskViewStore = create<TaskViewState>((set) => ({
  currentView: 'list',
  setCurrentView: (view: TaskViewType) => set({ currentView: view }),
}))
