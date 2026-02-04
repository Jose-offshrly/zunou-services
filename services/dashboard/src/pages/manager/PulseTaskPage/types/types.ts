// View Types
export type ViewType = 'table' | 'timeline' | 'calendar'

// Time Axis Options
export type TimeAxisScale =
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'
  | 'multi-year'

// Default View Date Options
export type DefaultViewDate = 'first' | 'current' | 'last'

// Time Zone Options
export type TimeZoneLevel = 'document' | 'user'

// Status Definition (customizable)
export interface StatusDefinition {
  id: string
  value: string // unique identifier
  label: string
  color: string
  isSystem?: boolean // System statuses cannot be deleted
  mapsToTaskStatus?: string // Maps to GraphQL TaskStatus if applicable
}

// Phase Definition (customizable)
export interface PhaseDefinition {
  id: string
  value: string // unique identifier
  label: string
  color: string
  isSystem?: boolean // System phases cannot be deleted
}

// Item Status - now uses string values from StatusDefinition
export type ItemStatus = string

// Item Phase - now uses string values from PhaseDefinition
export type ItemPhase = string

// Person/Owner (maps to Assignee from Task)
export interface Person {
  id: string
  name: string
  email: string
  avatar?: string
}

// Task Priority (from GraphQL TaskPriority enum)
export type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'

// Task Type (from GraphQL TaskType enum)
export type TaskType = 'TASK' | 'LIST'

// Task Reference - links TimelineItem to a Task
export interface TaskReference {
  taskId: string
  taskNumber?: string
  organizationId: string
  entityId?: string
  entityType?: string
  parentTaskId?: string
}

// Timeline Item (Row in the dataset)
// Can represent either a Task, a Milestone, or a standalone timeline item
export interface TimelineItem {
  id: string
  name: string
  description?: string
  startDate: Date | null
  endDate: Date | null
  duration?: number // in days
  owner?: Person
  phase?: ItemPhase
  status?: ItemStatus
  progress?: number // 0-100
  dependencies?: string[] // IDs of dependent items
  color?: string
  isMilestone?: boolean
  milestoneId?: string // ID of associated milestone (for non-milestone tasks)
  createdAt: Date
  updatedAt: Date

  // Task-related fields (when item is linked to a Task)
  taskReference?: TaskReference
  taskType?: TaskType // TASK or LIST
  priority?: TaskPriority
  categoryId?: string
  assignees?: Person[] // Multiple assignees (from Task.assignees)

  // Bidirectional reference: taskId can reference this timeline item
  // This allows tasks to reference timeline items and vice versa
  linkedTaskIds?: string[] // Array of task IDs that reference this timeline item
}

// Column Definition for Table View
export interface ColumnDefinition {
  id: string
  label: string
  field: keyof TimelineItem
  type: 'text' | 'date' | 'number' | 'person' | 'status' | 'phase' | 'progress'
  width?: number
  visible: boolean
  sortable: boolean
  filterable: boolean
}

// Filter Condition
export interface FilterCondition {
  id: string
  field: keyof TimelineItem
  operator:
    | 'equals'
    | 'not-equals'
    | 'contains'
    | 'greater-than'
    | 'less-than'
    | 'between'
    | 'is-empty'
    | 'is-not-empty'
  value: unknown
  secondValue?: unknown // for 'between' operator
}

// Sort Configuration
// Task sort fields include 'dueDate' which maps to task.due_date (not TimelineItem.endDate)
export type TaskSortField = 'status' | 'priority' | 'dueDate'
export interface SortConfig {
  field: keyof TimelineItem | TaskSortField
  direction: 'asc' | 'desc'
}

// Group Configuration
export interface GroupConfig {
  field: keyof TimelineItem | null
  collapsed: Record<string, boolean>
}

// Timeline Display Settings
export interface TimelineDisplaySettings {
  startDateColumn: string
  endDateColumn: string | null
  durationColumn: string | null
  timeAxisScale: TimeAxisScale
  defaultViewDate: DefaultViewDate
  showDependencies: boolean
  labelColumn: string
  peopleColumn: string | null
  truncateLabels: boolean
  showMilestones: boolean
  timeZoneLevel: TimeZoneLevel
  respectWorkingDays: boolean
}

// View Configuration (shared across views)
export interface ViewConfiguration {
  filters: FilterCondition[]
  sort: SortConfig | null
  groupBy: GroupConfig
  searchQuery: string
  visibleColumns: string[]
}

// Timeline State
export interface TimelineState {
  items: TimelineItem[]
  currentView: ViewType
  displaySettings: TimelineDisplaySettings
  viewConfig: ViewConfiguration
  selectedItems: string[]
  focusedDate: Date
  zoomLevel: number
  isPanelOpen: boolean
  panelAnchorEl: HTMLElement | null
  // Customizable status and phase definitions
  statusDefinitions: StatusDefinition[]
  phaseDefinitions: PhaseDefinition[]
}

// Timeline Actions
export interface TimelineActions {
  setCurrentView: (view: ViewType) => void
  setItems: (items: TimelineItem[]) => void
  addItem: (item: Omit<TimelineItem, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateItem: (id: string, updates: Partial<TimelineItem>) => void
  deleteItem: (id: string) => void
  addMilestone: (name: string, date: Date) => void
  setDisplaySettings: (settings: Partial<TimelineDisplaySettings>) => void
  setViewConfig: (config: Partial<ViewConfiguration>) => void
  setSelectedItems: (ids: string[]) => void
  setFocusedDate: (date: Date) => void
  setZoomLevel: (level: number) => void
  togglePanel: (anchorEl?: HTMLElement | null) => void
  closePanel: () => void
  // Drag and resize handlers
  moveItem: (id: string, newStartDate: Date, newEndDate: Date | null) => void
  resizeItem: (id: string, newEndDate: Date) => void
  // Task reference management
  linkTaskToItem: (itemId: string, taskId: string) => void
  unlinkTaskFromItem: (itemId: string, taskId: string) => void
  linkItemToTask: (taskId: string, itemId: string) => void
  unlinkItemFromTask: (taskId: string, itemId: string) => void
  // Status and Phase management
  addStatus: (status: Omit<StatusDefinition, 'id'>) => void
  updateStatus: (id: string, updates: Partial<StatusDefinition>) => void
  deleteStatus: (id: string) => void
  addPhase: (phase: Omit<PhaseDefinition, 'id'>) => void
  updatePhase: (id: string, updates: Partial<PhaseDefinition>) => void
  deletePhase: (id: string) => void
}

// Dependency Line
export interface DependencyLine {
  from: string
  to: string
  fromPosition: { x: number; y: number }
  toPosition: { x: number; y: number }
}

// Timeline Row (computed for rendering)
export interface TimelineRow {
  item: TimelineItem
  left: number // percentage or pixels from start
  width: number // percentage or pixels
  row: number // vertical position
  isMilestone: boolean
}

// Date Range for viewport
export interface DateRange {
  start: Date
  end: Date
}
