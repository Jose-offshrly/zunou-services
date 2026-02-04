import 'react-quill/dist/quill.snow.css'

import { alpha } from '@mui/material/styles'
import {
  NotificationKind,
  NotificationType,
  PulseMember,
} from '@zunou-graphql/core/graphql'
import { useCreateNotificationMutation } from '@zunou-queries/core/hooks/useCreateNotificationMutation'
import { useMarkTeamMessagesAsReadMutation } from '@zunou-queries/core/hooks/useMarkTeamMessagesAsReadMutation'
import { useUnreadTeamMessagesQuery } from '@zunou-queries/core/hooks/useUnreadTeamMessagesQuery'
import { theme } from '@zunou-react/services/Theme'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Control, useController } from 'react-hook-form'
import ReactQuill from 'react-quill'

import { useOrganization } from '~/hooks/useOrganization'
import { ThreadMessageInput } from '~/schemas/ThreadMessageSchema'
import { usePulseStore } from '~/store/usePulseStore'
import { extractPlainText } from '~/utils/textUtils'

interface Props {
  control: Control<ThreadMessageInput>
  handleSubmit: () => void
  onTyping?: (hasContent: boolean) => void
  quillToolbarIdModifier: string
}

export const useHooks = ({
  control,
  handleSubmit,
  onTyping,
  quillToolbarIdModifier,
}: Props) => {
  const { pulse, pulseMembers } = usePulseStore()
  const { organizationId } = useOrganization()
  const quillRef = useRef<ReactQuill>(null)

  const [mentions, setMentions] = useState<PulseMember[] | []>([])
  const [menuIndex, setMenuIndex] = useState(0)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [filteredMembers, setFilteredMembers] = useState<typeof pulseMembers>(
    [],
  )

  const modules = useMemo(
    () => ({
      clipboard: {
        matchVisual: false,
      },
      keyboard: {
        bindings: {
          enter: {
            handler: () => false,
            key: 13,
          },
        },
      },
      toolbar: { container: `#toolbar_${quillToolbarIdModifier}` },
    }),
    [],
  )
  const { field } = useController({ control, name: 'message' })

  const { mutate: markTeamMessagesAsRead } = useMarkTeamMessagesAsReadMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { data: unreadPulses, refetch: refetchUnreadPulses } =
    useUnreadTeamMessagesQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: { organizationId },
    })

  const hasUnreadMessages: boolean =
    Array.isArray(unreadPulses) && pulse?.id
      ? unreadPulses.some((pulse) => pulse.id === pulse?.id)
      : false

  const handleMarkMessagesAsRead = () => {
    if (hasUnreadMessages && pulse?.id && Array.isArray(unreadPulses)) {
      const unreadPulse = unreadPulses.find((p) => p.id === pulse?.id)
      const threadId = unreadPulse?.team_thread?.id
      if (threadId) {
        markTeamMessagesAsRead(
          { threadId },
          {
            onSuccess: () => {
              refetchUnreadPulses()
            },
          },
        )
      }
    }
  }

  const cleanContent = (content: string | null | undefined): string => {
    return (content ?? '')
      .trim()
      .replace(/(<p>(\s|&nbsp;)*<\/p>|<p><br><\/p>|<p>\s*<br>\s*<\/p>)*$/g, '')
      .replace(/\s+/g, ' ')
  }

  const isValidContent = useCallback(
    (content: string | null | undefined): boolean =>
      cleanContent(content).length > 0,
    [cleanContent],
  )

  const handleInputChange = useCallback(
    (value: string) => {
      field.onChange(value)
      onTyping?.(Boolean(cleanContent(value)))

      const plainText = extractPlainText(value)

      updateMentionSuggestions(plainText)
    },
    [field, onTyping, cleanContent, anchorEl],
  )

  const updateMentionSuggestions = (text: string) => {
    const quill = quillRef.current?.getEditor()
    if (!quill) return

    const range = quill.getSelection()
    if (!range) return

    const cursorPos = range.index
    const textBeforeCursor = text.slice(0, cursorPos)

    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    // Check if @ is at start or preceded by space
    const isValidAtTrigger =
      lastAtIndex >= 0 &&
      (lastAtIndex === 0 || textBeforeCursor[lastAtIndex - 1] === ' ')

    if (!isValidAtTrigger) {
      clearMentionSuggestions()
      return
    }

    // Get the mention text from the @ symbol to the cursor position
    const mentionText = textBeforeCursor.slice(lastAtIndex + 1)

    // Don't show suggestions if the mention text is empty
    if (mentionText === '') {
      setFilteredMembers(pulseMembers)
    } else {
      // Filter members based on the mention text
      const matchingMembers = pulseMembers
        .filter((member) =>
          member.user.name.toLowerCase().includes(mentionText.toLowerCase()),
        )
        .sort((a, b) => a.user.name.localeCompare(b.user.name))

      if (matchingMembers.length === 0) {
        clearMentionSuggestions()
        return
      }

      setFilteredMembers(matchingMembers)
    }

    // Show the menu
    if (!anchorEl) {
      const mentionAnchor = getMentionAnchorPosition()
      if (mentionAnchor) {
        setAnchorEl(mentionAnchor)
        quillRef.current?.getEditor().focus()
      }
    }
  }

  const clearMentionSuggestions = () => {
    if (anchorEl && document.body.contains(anchorEl)) {
      document.body.removeChild(anchorEl)
    }
    setAnchorEl(null)
    setFilteredMembers([])
    setMenuIndex(0)
  }

  const handleMention = (member: PulseMember) => {
    const quill = quillRef.current?.getEditor()
    if (!quill) return

    const range = quill.getSelection()
    if (!range) return

    const cursorPos = range.index
    const textBeforeCursor = quill.getText(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')

    if (atIndex === -1) return

    const mentionText = `@${member.user.name}`

    quill.deleteText(atIndex, cursorPos - atIndex)
    quill.insertText(atIndex, mentionText)
    quill.formatText(atIndex, mentionText.length, {
      background: alpha(theme.palette.primary.main, 0.2),
    })
    quill.format('background', false)

    setMenuIndex(0)
    setAnchorEl(null)
    setMentions((prev) => {
      if (prev.some((m) => m.id === member.id)) {
        return prev
      }

      return [...prev, member]
    })
  }

  const { mutate: createNotification } = useCreateNotificationMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleSubmitMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (isValidContent(field.value)) {
      const cleaned = cleanContent(field.value)

      if (cleaned) {
        await Promise.all(
          mentions.map((member) => {
            createNotification({
              description: cleaned,
              kind: NotificationKind.ChatMention,
              notifiableId: member.userId,
              pulseId: pulse?.id,
              type: NotificationType.Users,
            })
          }),
        )

        onTyping?.(false)
        field.onChange(cleaned)
        handleSubmit()
        field.onChange('')
      }
    }
    if (hasUnreadMessages) {
      handleMarkMessagesAsRead()
    }
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const isShift = e.shiftKey

      switch (e.key) {
        case 'Enter':
          if (isShift) {
            e.preventDefault()
            e.stopPropagation()
            return
          }

          if (!anchorEl) {
            handleSubmitMessage()
          } else {
            const selectedMember = filteredMembers[menuIndex]

            handleMention(selectedMember)
          }
          break
        case 'Escape':
          setMenuIndex(0)
          setAnchorEl(null)
          break
      }
    },
    [anchorEl, filteredMembers, menuIndex, handleSubmitMessage, handleMention],
  )

  const getMentionAnchorPosition = () => {
    const editor = quillRef.current?.getEditor()
    if (!editor) return

    const range = editor.getSelection()
    if (!range) return

    const textBeforeCursor = editor.getText(0, range.index)
    const atIndex = textBeforeCursor.lastIndexOf('@')

    if (atIndex === -1 || atIndex >= range.index) return

    const bounds = editor.getBounds(atIndex)
    if (!bounds) return

    const quillEditor = quillRef.current?.editor?.root
    if (!quillEditor) return

    const containerRect = quillEditor.getBoundingClientRect()
    const top = containerRect.top + bounds.top
    const left = containerRect.left + bounds.left

    const tempEl = document.createElement('div')
    tempEl.style.position = 'absolute'
    tempEl.style.top = `${top - 12}px`
    tempEl.style.left = `${left - 8}px`
    tempEl.style.height = '0'
    tempEl.style.width = '0'
    document.body.appendChild(tempEl)

    return tempEl
  }

  return {
    anchorEl,
    field,
    filteredMembers,
    handleInputChange,
    handleKeyDown,
    handleMarkMessagesAsRead,
    handleMention,
    handleSubmitMessage,
    isValidContent,
    menuIndex,
    modules,
    quillRef,
    setAnchorEl,
  }
}
