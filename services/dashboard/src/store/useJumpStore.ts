import { create } from 'zustand'

import { ChatType } from '~/pages/manager/TeamChatPage/components/ChatMessage'

type Anchor = {
  messageId: string
  destination: ChatType
  teamThreadId?: string | null
  replyTeamThreadId?: string | null
} | null

interface JumpState {
  lastJumpedMessageId: string | null
  setLastJumpedMessageId: (lastJumpedMessageId: string | null) => void

  lastJumpedMessageIdMiniPulseChat: string | null
  setLastJumpedMessageIdMiniPulseChat: (
    lastJumpedMessageIdMiniPulseChat: string | null,
  ) => void

  anchor: Anchor
  setAnchor: (anchor: Anchor) => void

  scrollToMessageId: () => void
}

export const useJumpStore = create<JumpState>((set, get) => ({
  anchor: null,
  lastJumpedMessageId: null,
  lastJumpedMessageIdMiniPulseChat: null,
  scrollToMessageId: () => {
    const { anchor } = get()

    if (!anchor) return

    const msgEl = document.getElementById(anchor.messageId)

    if (!msgEl) return

    msgEl.scrollIntoView({
      behavior: 'instant',
      block: 'center',
    })

    set({ anchor: null })
  },
  setAnchor: (anchor: Anchor) =>
    set({
      anchor,
      ...(anchor?.destination === 'MINI_PULSE_CHAT'
        ? { lastJumpedMessageIdMiniPulseChat: anchor.messageId }
        : { lastJumpedMessageId: anchor?.messageId }),
    }),
  setLastJumpedMessageId: (lastJumpedMessageId: string | null) =>
    set({ lastJumpedMessageId }),
  setLastJumpedMessageIdMiniPulseChat: (
    lastJumpedMessageIdMiniPulseChat: string | null,
  ) => set({ lastJumpedMessageIdMiniPulseChat }),
}))
