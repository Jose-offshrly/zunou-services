import { create } from 'zustand'

export interface SimpleTopic {
  id: string
  name: string
  hasUnread: boolean
  threadId?: string | null
}

export const DEFAULT_TOPIC: SimpleTopic = {
  hasUnread: false,
  id: 'general',
  name: 'General',
  threadId: null,
}

interface TopicState {
  currentPulseTopic: SimpleTopic
  setCurrentPulseTopic: (currentPulseTopic: SimpleTopic) => void
}

export const useTopicStore = create<TopicState>((set) => ({
  currentPulseTopic: DEFAULT_TOPIC,
  setCurrentPulseTopic: (currentPulseTopic: SimpleTopic) =>
    set({ currentPulseTopic }),
}))
