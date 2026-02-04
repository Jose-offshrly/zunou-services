import { create } from 'zustand'

import {
  PhaseDefinition,
  StatusDefinition,
  TimelineActions,
  TimelineDisplaySettings,
  TimelineItem,
  TimelineState,
  ViewConfiguration,
  ViewType,
} from '../types/types'

// Simple ID generator
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

// Default status definitions
const defaultStatusDefinitions: StatusDefinition[] = [
  {
    color: '#9E9E9E',
    id: 'status-not-started',
    isSystem: true,
    label: 'Not Started',
    mapsToTaskStatus: 'TODO',
    value: 'not-started',
  },
  {
    color: '#2196F3',
    id: 'status-in-progress',
    isSystem: true,
    label: 'In Progress',
    mapsToTaskStatus: 'INPROGRESS',
    value: 'in-progress',
  },
  {
    color: '#4CAF50',
    id: 'status-completed',
    isSystem: true,
    label: 'Completed',
    mapsToTaskStatus: 'COMPLETED',
    value: 'completed',
  },
  {
    color: '#f44336',
    id: 'status-blocked',
    isSystem: false,
    label: 'Blocked',
    value: 'blocked',
  },
  {
    color: '#FF9800',
    id: 'status-on-hold',
    isSystem: false,
    label: 'On Hold',
    value: 'on-hold',
  },
  {
    color: '#f44336',
    id: 'status-overdue',
    isSystem: true,
    label: 'Overdue',
    mapsToTaskStatus: 'OVERDUE',
    value: 'overdue',
  },
]

// Default phase definitions
const defaultPhaseDefinitions: PhaseDefinition[] = [
  {
    color: '#9C27B0',
    id: 'phase-planning',
    isSystem: false,
    label: 'Planning',
    value: 'planning',
  },
  {
    color: '#E91E63',
    id: 'phase-design',
    isSystem: false,
    label: 'Design',
    value: 'design',
  },
  {
    color: '#2196F3',
    id: 'phase-development',
    isSystem: false,
    label: 'Development',
    value: 'development',
  },
  {
    color: '#FF9800',
    id: 'phase-testing',
    isSystem: false,
    label: 'Testing',
    value: 'testing',
  },
  {
    color: '#4CAF50',
    id: 'phase-deployment',
    isSystem: false,
    label: 'Deployment',
    value: 'deployment',
  },
  {
    color: '#607D8B',
    id: 'phase-maintenance',
    isSystem: false,
    label: 'Maintenance',
    value: 'maintenance',
  },
]

const defaultDisplaySettings: TimelineDisplaySettings = {
  defaultViewDate: 'current',
  durationColumn: null,
  endDateColumn: 'endDate',
  labelColumn: 'name',
  peopleColumn: 'owner',
  respectWorkingDays: true,
  showDependencies: true,
  showMilestones: true,
  startDateColumn: 'startDate',
  timeAxisScale: 'week',
  timeZoneLevel: 'user',
  truncateLabels: true,
}

const defaultViewConfig: ViewConfiguration = {
  filters: [],
  groupBy: { collapsed: {}, field: null },
  searchQuery: '',
  sort: null,
  visibleColumns: [
    'name',
    'startDate',
    'endDate',
    'owner',
    'status',
    'phase',
    'progress',
  ],
}

// Sample data for demonstration
const sampleItems: TimelineItem[] = [
  {
    createdAt: new Date(),
    description: 'Initial project kickoff meeting',
    endDate: null,
    id: '1',
    isMilestone: true,
    name: 'Project Kickoff',
    owner: { email: 'john@example.com', id: 'u1', name: 'John Doe' },
    phase: 'planning',
    startDate: new Date('2026-01-13'),
    status: 'completed',
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    description: 'Gather and document all requirements',
    duration: 7,
    endDate: new Date('2026-01-20'),
    id: '2',
    name: 'Requirements Gathering',
    owner: { email: 'john@example.com', id: 'u1', name: 'John Doe' },
    phase: 'planning',
    progress: 60,
    startDate: new Date('2026-01-14'),
    status: 'in-progress',
    updatedAt: new Date(),
  },
  {
    color: '#4CAF50',
    createdAt: new Date(),
    dependencies: ['2'],
    description: 'Create wireframes and mockups',
    duration: 14,
    endDate: new Date('2026-02-03'),
    id: '3',
    name: 'Design Phase',
    owner: { email: 'jane@example.com', id: 'u2', name: 'Jane Smith' },
    phase: 'design',
    progress: 0,
    startDate: new Date('2026-01-21'),
    status: 'not-started',
    updatedAt: new Date(),
  },
  {
    color: '#4CAF50',
    createdAt: new Date(),
    dependencies: ['3'],
    description: 'Core feature development',
    duration: 14,
    endDate: new Date('2026-02-17'),
    id: '4',
    name: 'Development Sprint 1',
    owner: { email: 'bob@example.com', id: 'u3', name: 'Bob Johnson' },
    phase: 'development',
    progress: 0,
    startDate: new Date('2026-02-04'),
    status: 'not-started',
    updatedAt: new Date(),
  },
  {
    color: '#4CAF50',
    createdAt: new Date(),
    dependencies: ['4'],
    description: 'Additional features and integrations',
    duration: 14,
    endDate: new Date('2026-03-03'),
    id: '5',
    name: 'Development Sprint 2',
    owner: { email: 'bob@example.com', id: 'u3', name: 'Bob Johnson' },
    phase: 'development',
    progress: 0,
    startDate: new Date('2026-02-18'),
    status: 'not-started',
    updatedAt: new Date(),
  },
  {
    color: '#FF9800',
    createdAt: new Date(),
    dependencies: ['5'],
    description: 'Quality assurance and bug fixes',
    duration: 14,
    endDate: new Date('2026-03-17'),
    id: '6',
    name: 'QA Testing',
    owner: { email: 'alice@example.com', id: 'u4', name: 'Alice Brown' },
    phase: 'testing',
    progress: 0,
    startDate: new Date('2026-03-04'),
    status: 'not-started',
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    dependencies: ['6'],
    description: 'Release beta version',
    endDate: null,
    id: '7',
    isMilestone: true,
    name: 'Beta Release',
    owner: { email: 'john@example.com', id: 'u1', name: 'John Doe' },
    phase: 'deployment',
    startDate: new Date('2026-03-18'),
    status: 'not-started',
    updatedAt: new Date(),
  },
  {
    color: '#9C27B0',
    createdAt: new Date(),
    dependencies: ['7'],
    description: 'Deploy to production environment',
    duration: 3,
    endDate: new Date('2026-03-27'),
    id: '8',
    name: 'Production Deployment',
    owner: { email: 'bob@example.com', id: 'u3', name: 'Bob Johnson' },
    phase: 'deployment',
    progress: 0,
    startDate: new Date('2026-03-25'),
    status: 'not-started',
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    dependencies: ['8'],
    description: 'Official product launch',
    endDate: null,
    id: '9',
    isMilestone: true,
    name: 'Launch Day',
    owner: { email: 'john@example.com', id: 'u1', name: 'John Doe' },
    phase: 'deployment',
    startDate: new Date('2026-03-30'),
    status: 'not-started',
    updatedAt: new Date(),
  },
]

interface TimelineStore extends TimelineState, TimelineActions {}

export const useTimelineStore = create<TimelineStore>((set) => ({
  addItem: (item) => {
    const newItem: TimelineItem = {
      ...item,
      createdAt: new Date(),
      id: generateId(),
      linkedTaskIds: item.linkedTaskIds || [],
      updatedAt: new Date(),
    }
    set((state) => ({ items: [...state.items, newItem] }))
  },

  addMilestone: (name, date) => {
    const milestone: TimelineItem = {
      createdAt: new Date(),
      endDate: null,
      id: generateId(),
      isMilestone: true,
      linkedTaskIds: [],
      name,
      startDate: date,
      updatedAt: new Date(),
    }
    set((state) => ({ items: [...state.items, milestone] }))
  },

  addPhase: (phase) => {
    const newPhase: PhaseDefinition = {
      ...phase,
      id: generateId(),
    }
    set((state) => ({
      phaseDefinitions: [...state.phaseDefinitions, newPhase],
    }))
  },

  addStatus: (status) => {
    const newStatus: StatusDefinition = {
      ...status,
      id: generateId(),
    }
    set((state) => ({
      statusDefinitions: [...state.statusDefinitions, newStatus],
    }))
  },

  closePanel: () => set({ isPanelOpen: false, panelAnchorEl: null }),

  currentView: 'timeline' as ViewType,

  deleteItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      selectedItems: state.selectedItems.filter((itemId) => itemId !== id),
    }))
  },

  deletePhase: (id) => {
    set((state) => {
      const phase = state.phaseDefinitions.find((p) => p.id === id)
      // Prevent deletion of system phases
      if (phase?.isSystem) {
        return state
      }
      return {
        // Update items that use this phase to remove it
        items: state.items.map((item) => {
          if (item.phase === phase?.value) {
            return {
              ...item,
              phase: undefined,
              updatedAt: new Date(),
            }
          }
          return item
        }),
        phaseDefinitions: state.phaseDefinitions.filter((p) => p.id !== id),
      }
    })
  },

  deleteStatus: (id) => {
    set((state) => {
      const status = state.statusDefinitions.find((s) => s.id === id)
      // Prevent deletion of system statuses
      if (status?.isSystem) {
        return state
      }
      return {
        // Update items that use this status to use a default status
        items: state.items.map((item) => {
          if (item.status === status?.value) {
            const defaultStatus = state.statusDefinitions.find(
              (s) => s.isSystem && s.value === 'not-started',
            )
            return {
              ...item,
              status: defaultStatus?.value || 'not-started',
              updatedAt: new Date(),
            }
          }
          return item
        }),
        statusDefinitions: state.statusDefinitions.filter((s) => s.id !== id),
      }
    })
  },

  displaySettings: defaultDisplaySettings,

  focusedDate: new Date(),
  isPanelOpen: false,

  items: sampleItems,

  // Task reference management
  linkItemToTask: (taskId, itemId) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== itemId) return item
        const linkedTaskIds = item.linkedTaskIds || []
        if (linkedTaskIds.includes(taskId)) return item
        return {
          ...item,
          linkedTaskIds: [...linkedTaskIds, taskId],
          updatedAt: new Date(),
        }
      }),
    }))
  },

  linkTaskToItem: (itemId, taskId) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== itemId) return item
        const linkedTaskIds = item.linkedTaskIds || []
        if (linkedTaskIds.includes(taskId)) return item
        return {
          ...item,
          linkedTaskIds: [...linkedTaskIds, taskId],
          updatedAt: new Date(),
        }
      }),
    }))
  },

  moveItem: (id, newStartDate, newEndDate) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== id) return item

        const updates: Partial<TimelineItem> = {
          startDate: newStartDate,
          updatedAt: new Date(),
        }

        if (newEndDate) {
          updates.endDate = newEndDate
          updates.duration = Math.ceil(
            (newEndDate.getTime() - newStartDate.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        }

        return { ...item, ...updates }
      }),
    }))
  },

  panelAnchorEl: null,

  phaseDefinitions: defaultPhaseDefinitions,

  resizeItem: (id, newEndDate) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== id || !item.startDate) return item

        const duration = Math.ceil(
          (newEndDate.getTime() - item.startDate.getTime()) /
            (1000 * 60 * 60 * 24),
        )

        return {
          ...item,
          duration,
          endDate: newEndDate,
          updatedAt: new Date(),
        }
      }),
    }))
  },

  selectedItems: [],

  setCurrentView: (view: ViewType) => set({ currentView: view }),

  setDisplaySettings: (settings) => {
    set((state) => ({
      displaySettings: { ...state.displaySettings, ...settings },
    }))
  },
  setFocusedDate: (date) => set({ focusedDate: date }),

  setItems: (items: TimelineItem[]) => set({ items }),

  setSelectedItems: (ids) => set({ selectedItems: ids }),

  setViewConfig: (config) => {
    set((state) => ({
      viewConfig: { ...state.viewConfig, ...config },
    }))
  },

  setZoomLevel: (level) =>
    set({ zoomLevel: Math.max(0.5, Math.min(3, level)) }),

  statusDefinitions: defaultStatusDefinitions,

  togglePanel: (anchorEl?: HTMLElement | null) =>
    set((state) => ({
      isPanelOpen: anchorEl ? true : !state.isPanelOpen,
      panelAnchorEl:
        anchorEl ?? (state.isPanelOpen ? null : state.panelAnchorEl),
    })),

  unlinkItemFromTask: (taskId, itemId) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== itemId) return item
        const linkedTaskIds = item.linkedTaskIds || []
        return {
          ...item,
          linkedTaskIds: linkedTaskIds.filter((id) => id !== taskId),
          updatedAt: new Date(),
        }
      }),
    }))
  },

  unlinkTaskFromItem: (itemId, taskId) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== itemId) return item
        const linkedTaskIds = item.linkedTaskIds || []
        return {
          ...item,
          linkedTaskIds: linkedTaskIds.filter((id) => id !== taskId),
          updatedAt: new Date(),
        }
      }),
    }))
  },

  updateItem: (id, updates) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item,
      ),
    }))
  },

  updatePhase: (id, updates) => {
    set((state) => ({
      phaseDefinitions: state.phaseDefinitions.map((phase) =>
        phase.id === id ? { ...phase, ...updates } : phase,
      ),
    }))
  },

  updateStatus: (id, updates) => {
    set((state) => ({
      statusDefinitions: state.statusDefinitions.map((status) =>
        status.id === id ? { ...status, ...updates } : status,
      ),
    }))
  },

  viewConfig: defaultViewConfig,

  zoomLevel: 1,
}))

// Selectors
export const useFilteredItems = () => {
  const items = useTimelineStore((state) => state.items)
  const { filters, searchQuery, sort } = useTimelineStore(
    (state) => state.viewConfig,
  )

  let filtered = [...items]

  // Apply search
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query),
    )
  }

  // Apply filters
  filters.forEach((filter) => {
    filtered = filtered.filter((item) => {
      const value = item[filter.field]

      switch (filter.operator) {
        case 'equals':
          if (typeof value === 'object' && value !== null && 'id' in value) {
            // Person object comparison
            return (value as { id: string }).id === filter.value
          }
          return value === filter.value
        case 'not-equals':
          if (typeof value === 'object' && value !== null && 'id' in value) {
            return (value as { id: string }).id !== filter.value
          }
          return value !== filter.value
        case 'contains':
          if (typeof value === 'object' && value !== null) {
            if ('name' in value) {
              // Person object
              return String((value as { name: string }).name ?? '')
                .toLowerCase()
                .includes(String(filter.value).toLowerCase())
            }
            return JSON.stringify(value)
              .toLowerCase()
              .includes(String(filter.value).toLowerCase())
          }
          return String(value ?? '')
            .toLowerCase()
            .includes(String(filter.value).toLowerCase())
        case 'greater-than':
          if (value instanceof Date && filter.value instanceof Date) {
            return value.getTime() > filter.value.getTime()
          }
          if (typeof value === 'number' && typeof filter.value === 'number') {
            return value > filter.value
          }
          return false
        case 'less-than':
          if (value instanceof Date && filter.value instanceof Date) {
            return value.getTime() < filter.value.getTime()
          }
          if (typeof value === 'number' && typeof filter.value === 'number') {
            return value < filter.value
          }
          return false
        case 'between':
          if (
            value instanceof Date &&
            filter.value instanceof Date &&
            filter.secondValue instanceof Date
          ) {
            const time = value.getTime()
            return (
              time >= filter.value.getTime() &&
              time <= filter.secondValue.getTime()
            )
          }
          if (
            typeof value === 'number' &&
            typeof filter.value === 'number' &&
            typeof filter.secondValue === 'number'
          ) {
            return value >= filter.value && value <= filter.secondValue
          }
          return false
        case 'is-empty':
          if (value instanceof Date) {
            return false // Dates are never "empty" in this context
          }
          return value === null || value === undefined || value === ''
        case 'is-not-empty':
          if (value instanceof Date) {
            return true // Dates are always "not empty" if they exist
          }
          return value !== null && value !== undefined && value !== ''
        default:
          return true
      }
    })
  })

  // Apply sort
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort.field as keyof TimelineItem]
      const bVal = b[sort.field as keyof TimelineItem]

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      let comparison = 0
      if (aVal < bVal) comparison = -1
      if (aVal > bVal) comparison = 1

      return sort.direction === 'desc' ? -comparison : comparison
    })
  }

  return filtered
}

// Get grouped items
export const useGroupedItems = () => {
  const filtered = useFilteredItems()
  const groupBy = useTimelineStore((state) => state.viewConfig.groupBy)

  if (!groupBy.field) {
    return { ungrouped: filtered }
  }

  const groups: Record<string, TimelineItem[]> = {}

  filtered.forEach((item) => {
    const groupValue = item[groupBy.field!]
    let key = 'Ungrouped'
    if (groupValue) {
      if (
        typeof groupValue === 'object' &&
        groupValue !== null &&
        'name' in groupValue
      ) {
        key = (groupValue as { name: string }).name
      } else if (typeof groupValue !== 'object') {
        key = String(groupValue)
      }
    }

    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
  })

  return groups
}

// Get milestones only
export const useMilestones = () => {
  const items = useFilteredItems()
  const showMilestones = useTimelineStore(
    (state) => state.displaySettings.showMilestones,
  )

  if (!showMilestones) return []

  return items.filter(
    (item) =>
      item.isMilestone || (item.startDate && !item.endDate && !item.duration),
  )
}

// Get date range for viewport
export const useDateRange = () => {
  const items = useFilteredItems()
  const focusedDate = useTimelineStore((state) => state.focusedDate)
  const timeAxisScale = useTimelineStore(
    (state) => state.displaySettings.timeAxisScale,
  )

  if (items.length === 0) {
    const start = new Date(focusedDate)
    start.setDate(start.getDate() - 14)
    const end = new Date(focusedDate)
    end.setDate(end.getDate() + 14)
    return { end, start }
  }

  let minDate = new Date(focusedDate)
  let maxDate = new Date(focusedDate)

  items.forEach((item) => {
    if (item.startDate && item.startDate < minDate) {
      minDate = new Date(item.startDate)
    }
    if (item.endDate && item.endDate > maxDate) {
      maxDate = new Date(item.endDate)
    }
    if (item.startDate && item.startDate > maxDate) {
      maxDate = new Date(item.startDate)
    }
  })

  // Add padding based on scale
  const padding = {
    day: 3,
    month: 14,
    'multi-year': 180,
    quarter: 30,
    week: 7,
    year: 60,
  }[timeAxisScale]

  minDate.setDate(minDate.getDate() - padding)
  maxDate.setDate(maxDate.getDate() + padding)

  return { end: maxDate, start: minDate }
}
