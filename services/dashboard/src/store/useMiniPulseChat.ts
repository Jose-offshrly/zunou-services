import { create } from 'zustand'

interface MessageSearchState {
  openMiniPulseChat: boolean
  setOpenMiniPulseChat: (openMiniPulseChat: boolean) => void
  currentReplyThreadId: string | null
  setCurrentReplyThreadId: (currentReplyThreadId: string | null) => void
  currentReplyThreadDate: string | null
  setCurrentReplyThreadDate: (currentReplyThreadDate: string | null) => void
  threadTitle: string | null
  setThreadTitle: (currentReplyThreadDate: string | null) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

export const useMiniPulseChat = create<MessageSearchState>((set) => ({
  currentReplyThreadDate: null,
  currentReplyThreadId: null,
  loading: false,
  openMiniPulseChat: false,
  setCurrentReplyThreadDate: (currentReplyThreadDate: string | null) =>
    set({ currentReplyThreadDate }),
  setCurrentReplyThreadId: (currentReplyThreadId: string | null) =>
    set({ currentReplyThreadId }),
  setLoading: (loading: boolean) => set({ loading }),
  setOpenMiniPulseChat: (openMiniPulseChat: boolean) =>
    set({ openMiniPulseChat }),
  setThreadTitle: (threadTitle: string | null) => set({ threadTitle }),
  threadTitle: null,
}))
