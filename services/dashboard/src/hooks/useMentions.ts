import { useState } from 'react'

interface BaseMember {
  id: string
  user: { id: string; name: string }
}

interface Props<TMember extends BaseMember> {
  allMembers: TMember[]
  getTextBeforeCursor: () => string
  insertMentionAtCursor: (member: TMember) => number | null
  getAnchorPosition?: (triggerIndex: number) => HTMLElement | null | undefined
}

interface MentionEntry<T> {
  member: T
  atIndex: number | null
}

export const useMentions = <TMember extends BaseMember>({
  allMembers,
  getTextBeforeCursor,
  insertMentionAtCursor,
  getAnchorPosition,
}: Props<TMember>) => {
  const [mentions, setMentions] = useState<MentionEntry<TMember>[]>([])
  const [menuIndex, setMenuIndex] = useState(0)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [filteredMembers, setFilteredMembers] = useState<TMember[]>([])

  const clearMentionSuggestions = () => {
    if (anchorEl && document.body.contains(anchorEl)) {
      document.body.removeChild(anchorEl)
    }
    setAnchorEl(null)
    setFilteredMembers([])
    setMenuIndex(0)
  }

  const updateMentionSuggestions = () => {
    const text = getTextBeforeCursor()
    const lastAtIndex = text.lastIndexOf('@')

    if (lastAtIndex === -1) {
      clearMentionSuggestions()
      return
    }

    if (mentions.some((m) => m.atIndex === lastAtIndex)) {
      clearMentionSuggestions()
      return
    }

    const mentionText = text.slice(lastAtIndex + 1)

    const matches = mentionText
      ? allMembers.filter((m) =>
          m.user.name.toLowerCase().includes(mentionText.toLowerCase()),
        )
      : allMembers

    if (!matches.length) {
      clearMentionSuggestions()
      return
    }

    setFilteredMembers(matches)

    if (!anchorEl && getAnchorPosition) {
      const anchor = getAnchorPosition(lastAtIndex)
      if (anchor) setAnchorEl(anchor)
    }
  }

  const handleMentionSelect = (member: TMember) => {
    const atIndex = insertMentionAtCursor(member)

    if (atIndex === null) return

    setMentions((prev) =>
      prev.some((m) => m.member.id === member.id && m.atIndex === atIndex)
        ? prev
        : [...prev, { atIndex, member }],
    )

    clearMentionSuggestions()
  }

  return {
    anchorEl,
    filteredMembers,
    handleMentionSelect,
    mentions,
    menuIndex,
    setAnchorEl,
    setMenuIndex,
    updateMentionSuggestions,
  }
}
