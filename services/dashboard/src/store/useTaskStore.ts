import { Task, TaskType } from '@zunou-graphql/core/graphql'
import { TaskFilters } from '@zunou-queries/core/hooks/useGetTasksQuery'
import { create } from 'zustand'

interface TaskState {
  isTaskFilterActive: boolean
  setIsTaskFilterActive: (isTaskFilterActive: boolean) => void

  isLoadingTasks: boolean
  setIsLoadingTasks: (value: boolean) => void

  pulseTasks: Task[]
  setPulseTasks: (tasks: Task[]) => void
  isUpdatingTaskOrder: boolean
  setUpdatingTaskOrder: (isUpdatingTaskOrder: boolean) => void

  filters: TaskFilters
  setFilters: (
    filters: TaskFilters | ((prev: TaskFilters) => TaskFilters),
  ) => void

  // state and actions for create task modals
  isCreateTaskModalOpen: boolean
  isCreateTaskListModalOpen: boolean
  closeCreateTaskModal: () => void
  closeCreateTaskListModal: () => void

  activeTaskSectionType: TaskType | null
  setActiveTaskSectionType: (type: TaskType | null) => void

  handleCreateTask: () => void
  handleCreateTaskList: () => void

  // Dummy data flag
  useDummyData: boolean
  setUseDummyData: (useDummyData: boolean) => void
}

export const useTaskStore = create<TaskState>((set) => ({
  activeTaskSectionType: null,
  closeCreateTaskListModal: () => set({ isCreateTaskListModalOpen: false }),
  closeCreateTaskModal: () => set({ isCreateTaskModalOpen: false }),

  filters: {
    assigneeId: null,
    date: null,
    dateRange: null,
    entityId: null,
    excludeAssigneeId: null,
    excludePriority: null,
    excludeStatus: null,
    excludeTaskStatusId: null,
    isPersonalTasks: null,
    priority: null,
    search: '',
    showCompletedTasks: false,
    status: null,
    taskStatusId: null,
  },

  // open modal or show form section based on whether there are existing tasks
  handleCreateTask: () =>
    set((state) => {
      if (state.pulseTasks.length > 0) {
        return { isCreateTaskModalOpen: true }
      }
      return { activeTaskSectionType: TaskType.Task }
    }),

  handleCreateTaskList: () =>
    set((state) => {
      if (state.pulseTasks.length > 0) {
        return { isCreateTaskListModalOpen: true }
      }
      return { activeTaskSectionType: TaskType.List }
    }),

  // task modal state and actions
  isCreateTaskListModalOpen: false,
  isCreateTaskModalOpen: false,
  isLoadingTasks: false,
  isTaskFilterActive: false,
  isUpdatingTaskOrder: false,
  pulseTasks: [],

  setActiveTaskSectionType: (type) => set({ activeTaskSectionType: type }),

  setFilters: (filters) => {
    set((state) => {
      const update =
        typeof filters === 'function' ? filters(state.filters) : filters

      return {
        filters: {
          ...state.filters,
          ...update,
        },
      }
    })
  },

  // setters for opening and closing modals/sections
  setIsLoadingTasks: (isLoadingTasks: boolean) => set({ isLoadingTasks }),
  setIsTaskFilterActive: (isTaskFilterActive: boolean) =>
    set({ isTaskFilterActive }),
  setPulseTasks: (tasks: Task[]) => set({ pulseTasks: tasks }),
  setUpdatingTaskOrder: (isUpdatingTaskOrder: boolean) =>
    set({ isUpdatingTaskOrder }),

  setUseDummyData: (useDummyData: boolean) => set({ useDummyData }),
  // Dummy data flag (default to true for now to use dummy data)
  useDummyData: true,
}))
