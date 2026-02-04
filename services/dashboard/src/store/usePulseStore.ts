import {
  Pulse,
  PulseCategory,
  PulseMember,
  PulseMemberRole,
  PulseStatusOption,
  PulseWelcomeData,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '@zunou-graphql/core/graphql'
import { ValueOf } from 'zunou-react/utils/valueOf'
import { create } from 'zustand'

import { AttachmentFile } from '~/components/ui/form/SlateInput/attachments'
import { NoteAttachmentInputWithTempUrl } from '~/pages/manager/NotesPage'
import { PulsePermission, PulsePermissionMap } from '~/types/permissions'

export const SelectedTabEnum = {
  FEED: 'feed',
  NOTES: 'notes',
  ORGANIZATION: 'organization',
  ORG_CHART: 'org-chart',
  PULSE: '',
  TASKS: 'tasks',
  TEAM_CHAT: 'team-chat',
  TIMELINE: 'timeline',
} as const

export type SelectedTab = ValueOf<typeof SelectedTabEnum> | null

export enum ShowPulseWelcomeState {
  FirstTime = 'FIRST_TIME',
  Show = 'SHOW',
  Hidden = 'HIDDEN',
}
interface PulseWelcomeState {
  pulseId: string
  state: ShowPulseWelcomeState
  initialData: PulseWelcomeData | null
}

interface PulseDelayedLoader {
  message: string | null
  isShowing: boolean
}

export interface ActiveTab {
  tabIndex: number
  selectedTab: SelectedTab
  path: string
}

export interface CreateNoteInputWithAttachment {
  title?: string
  description?: string
  labels?: string[]
  isPinned?: boolean
  fileAttachments?: NoteAttachmentInputWithTempUrl[]
  isCreateOpen: boolean
}

export interface CreateTaskInput {
  id?: string
  location: string
  title?: string
  description?: string
  isShowDescription?: boolean
  status?: TaskStatus | null
  assignees?: string[]
  dueDate?: string
  priority?: TaskPriority | null
  parentId?: string
  type?: TaskType | undefined
  isOpen?: boolean
}

export interface SelectedTopic {
  id: string
  name: string
  hasUnread: boolean
}

// List of actions triggered in pulse
export interface PulseActions {
  id: string
  pulseChatInput: string
  teamChatInput: string
  replyingToTeamChat: {
    id: string
    name: string
    content: string
  } | null
  replyingToMiniPulseChat: {
    id: string
    replyTeamThreadId: string
    name: string
    content: string
  } | null
  teamChatAttachments: AttachmentFile[]
  miniPulseChatAttachments: AttachmentFile[]
  activeTab: ActiveTab | null
  expandedTaskList: string[]
  createNoteInput: CreateNoteInputWithAttachment | null
  createTaskInput: CreateTaskInput[]
  editTaskInput: CreateTaskInput[]
  editingTasks: { id: string; status: boolean }[]
}

// Used to determine current mode in pulse chat
type PulseChatMode = 'CHAT' | 'INSIGHTS'

interface PulseState {
  isPulseRefreshDisabled: boolean
  pulseWelcomeState: PulseWelcomeState[]
  setPulseWelcomeState: (
    pulseWelcomeState:
      | PulseWelcomeState[]
      | ((prevState: PulseWelcomeState[]) => PulseWelcomeState[]),
  ) => void
  activeThreadId: string | null
  isLoading: boolean
  pulseDelayedLoader: PulseDelayedLoader
  setIsLoading: (value: boolean) => void
  selectedTab: SelectedTab
  setIsPulseRefreshDisabled: (isPulseRefreshDisabled: boolean) => void
  setSelectedTab: (selectedTab: SelectedTab) => void
  pulse: Pulse | null
  pulseCategory: PulseCategory | null
  pulseStatusOption: PulseStatusOption | null
  pulseMembership: PulseMember | null
  pulseMembers: PulseMember[] | []
  permissions: PulsePermission[]
  setActiveThreadId: (id: string | null) => void
  setPulse: (pulse: Pulse | null) => void
  setPulseCategory: (category: PulseCategory) => void
  setPulseStatusOption: (statusOption: PulseStatusOption | null) => void
  setPulseDelayedLoader: (pulseDelayedLoader: PulseDelayedLoader) => void
  setPulseMembership: (pulseMembership: PulseMember | null) => void
  setPermissions: (pulseMemberRole: PulseMemberRole) => void
  setPulseMembers: (pulseMembers: PulseMember[]) => void
  pulseActions: PulseActions[]
  addActionToPulse: ({
    id,
    updates,
  }: {
    id: string
    updates:
      | Partial<Omit<PulseActions, 'id'>>
      | ((current: PulseActions) => Partial<Omit<PulseActions, 'id'>>)
  }) => void
  currentTopic: SelectedTopic | undefined
  setCurrentTopic: (currentTopic: SelectedTopic | undefined) => void
  pulseChatMode: PulseChatMode
  setPulseChatMode: (pulseChatMode: PulseChatMode) => void
}

export const usePulseStore = create<PulseState>((set) => ({
  activeThreadId: null,
  // Add this new function to your store
  addActionToPulse: ({
    id,
    updates,
  }: {
    id: string
    updates:
      | Partial<Omit<PulseActions, 'id'>>
      | ((current: PulseActions) => Partial<Omit<PulseActions, 'id'>>)
  }) =>
    set((state) => {
      const existingActionIndex = state.pulseActions.findIndex(
        (existingAction) => existingAction.id === id,
      )

      if (existingActionIndex !== -1) {
        // Update existing action by merging with new updates
        const updatedActions = [...state.pulseActions]
        const currentAction = updatedActions[existingActionIndex]

        // Support both object and function updates
        const resolvedUpdates =
          typeof updates === 'function' ? updates(currentAction) : updates

        updatedActions[existingActionIndex] = {
          ...currentAction,
          ...resolvedUpdates,
        }

        return { pulseActions: updatedActions }
      } else {
        // Create new action with default values + updates
        const defaultAction: PulseActions = {
          activeTab: null,
          createNoteInput: null,
          createTaskInput: [],
          editTaskInput: [],
          editingTasks: [],
          expandedTaskList: [],
          id,
          miniPulseChatAttachments: [],
          pulseChatInput: '',
          replyingToMiniPulseChat: null,
          replyingToTeamChat: null,
          teamChatAttachments: [],
          teamChatInput: '',
        }

        const resolvedUpdates =
          typeof updates === 'function' ? updates(defaultAction) : updates

        const newAction: PulseActions = {
          ...defaultAction,
          ...resolvedUpdates,
        }

        return {
          pulseActions: [...state.pulseActions, newAction],
        }
      }
    }),

  currentTopic: undefined,

  isLoading: false,

  isPulseRefreshDisabled: true,

  permissions: [],
  pulse: null,
  pulseActions: [],
  pulseCategory: null,
  pulseChatMode: 'INSIGHTS',
  pulseDelayedLoader: { isShowing: false, message: null },
  pulseMembers: [],

  pulseMembership: null,

  pulseStatusOption: null,

  pulseWelcomeState: [],
  selectedTab: SelectedTabEnum.PULSE,
  setActiveThreadId: (id: string | null) => set({ activeThreadId: id }),
  setCurrentTopic: (currentTopic: SelectedTopic | undefined) =>
    set({ currentTopic }),

  setIsLoading: (isLoading: boolean) => set({ isLoading }),

  setIsPulseRefreshDisabled: (isPulseRefreshDisabled: boolean) =>
    set({ isPulseRefreshDisabled }),
  setPermissions: (pulseMemberRole: PulseMemberRole) =>
    set({ permissions: PulsePermissionMap[pulseMemberRole] }),
  setPulse: (pulse: Pulse | null) => set({ pulse }),
  setPulseCategory: (category: PulseCategory) =>
    set({ pulseCategory: category }),
  setPulseChatMode: (pulseChatMode: PulseChatMode) => set({ pulseChatMode }),
  setPulseDelayedLoader: (pulseDelayedLoader: PulseDelayedLoader) =>
    set({ pulseDelayedLoader }),
  setPulseMembers: (pulseMembers: PulseMember[]) => {
    set({ pulseMembers })
  },

  setPulseMembership: (pulseMembership: PulseMember | null) =>
    set({ pulseMembership }),
  setPulseStatusOption: (statusOption: PulseStatusOption | null) =>
    set({ pulseStatusOption: statusOption }),

  setPulseWelcomeState: (pulseWelcomeState) =>
    set((state) => ({
      pulseWelcomeState:
        typeof pulseWelcomeState === 'function'
          ? pulseWelcomeState(state.pulseWelcomeState)
          : pulseWelcomeState,
    })),

  setSelectedTab: (tab: SelectedTab) => {
    if (tab !== undefined) {
      set({ selectedTab: tab })
    }
  },
  unassignedOrganizationGroups: [] as PulseMember[],
}))
