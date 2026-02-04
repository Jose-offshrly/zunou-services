import 'react-quill/dist/quill.snow.css'

import {
  ChevronRight,
  ContentCopy,
  DeleteOutline,
  EditOutlined,
  Link as LinkIcon,
  MoreVertOutlined,
  PushPin,
  PushPinOutlined,
  ReplyOutlined,
} from '@mui/icons-material'
import {
  alpha,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material'
import { useToggleDirectMessageReactionMutation } from '@zunou-queries/core/hooks/useToggleDirectMessageReaction'
import { useToggleTeamMessageReactionMutation } from '@zunou-queries/core/hooks/useToggleTeamMessageReaction'
import { useUpdatePinTeamMessageMutation } from '@zunou-queries/core/hooks/useUpdatePinTeamMessage.ts'
import { theme } from '@zunou-react/services/Theme'
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Descendant, Element as SlateElement, Text } from 'slate'

import { DeleteMessageModal } from '~/components/ui/DeleteMessageModal'
import { useEditing } from '~/context/MessageListContext'
import { usePulseStore } from '~/store/usePulseStore'

import { ChatType } from '../ChatMessage'
import EmojiPickerButton from './EmojiPickerButton'

interface MessageActionsProps {
  id: string
  name: string
  gravatar?: string | null
  content: string | null
  messageDate: string
  allowEdit?: boolean
  allowDelete?: boolean
  isFlipped?: boolean
  handleDeleteMessage?: (messageId: string) => Promise<void>
  onEditMessage?: (messageId: string) => void
  onPinMessage?: (messageId: string) => void
  onReaction?: (messageId: string, reaction: string) => void
  onReply?: (message: { id: string; name: string; content: string }) => void
  setIsHovered?: React.Dispatch<React.SetStateAction<boolean>>
  isVisible: boolean
  isPinned?: boolean
  type: ChatType
  replyTeamThreadId?: string
  threadId?: string
  organizationId?: string
}

const QUICK_REACTIONS = ['👍', '✅']

const MENU_ITEMS = [
  {
    action: 'addReaction',
    disabled: false,
    icon: ChevronRight,
    label: 'Add Reaction',
  },
  {
    action: 'reply',
    disabled: false,
    icon: ReplyOutlined,
    label: 'Reply',
  },
  {
    action: 'copyText',
    disabled: false,
    icon: ContentCopy,
    label: 'Copy Text',
  },
  {
    action: 'copyLink',
    disabled: true,
    icon: LinkIcon,
    label: 'Copy Message Link',
  },
] as const

const ACTION_MENU_ITEMS = [
  {
    action: 'edit',
    color: 'text.secondary',
    disabled: false,
    icon: EditOutlined,
    label: 'Edit',
  },
  {
    action: 'delete',
    color: 'error.main',
    disabled: false,
    icon: DeleteOutline,
    label: 'Delete',
  },
] as const

export const MessageActions = ({
  id,
  name,
  gravatar,
  content,
  messageDate,
  allowEdit = false,
  allowDelete = false,
  isFlipped = false,
  handleDeleteMessage,
  onEditMessage,
  onPinMessage,
  onReaction,
  onReply,
  setIsHovered,
  isVisible,
  isPinned = false,
  type,
  replyTeamThreadId,
  threadId,
  organizationId,
}: MessageActionsProps) => {
  const { pulseId } = useParams<{ pulseId?: string }>()
  const { addActionToPulse } = usePulseStore()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null)
  const { setCurrentEditingId } = useEditing()
  const { t } = useTranslation()

  const isMenuOpen = Boolean(anchorEl)
  const isEmojiMenuOpen = Boolean(emojiAnchorEl)
  const shouldHideMainMenu = isEmojiMenuOpen && isMenuOpen

  const updatePinTeamMessage = useUpdatePinTeamMessageMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const toggleTeamMessageReaction = useToggleTeamMessageReactionMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const toggleDirectMessageReaction = useToggleDirectMessageReactionMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const updateReplyingToInStore = ({
    id,
    name,
    content,
    teamMessageId,
    type,
  }: {
    id: string
    name: string
    content: string
    teamMessageId: string
    type: ChatType
  }) => {
    if (type === 'MINI_PULSE_CHAT' && replyTeamThreadId)
      addActionToPulse({
        id,
        updates: {
          replyingToMiniPulseChat: {
            content: content ?? '',
            id: teamMessageId,
            name,
            replyTeamThreadId: replyTeamThreadId ?? '',
          },
        },
      })

    if (type === 'TEAM_CHAT')
      addActionToPulse({
        id,
        updates: {
          replyingToTeamChat: {
            content: content ?? '',
            id: teamMessageId,
            name,
          },
        },
      })
  }

  const handleMoreClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setTimeout(() => {
      setIsHovered?.(false)
    }, 100)
  }

  const handleEmojiClose = () => {
    setEmojiAnchorEl(null)
    // Also close the main menu when emoji picker closes
    handleMenuClose()
  }

  const handleEdit = () => {
    if (onEditMessage) {
      onEditMessage(id)
      // Still set currentEditingId so the inline editor shows
      setCurrentEditingId(id)
    } else {
      setCurrentEditingId(id)
    }
    handleMenuClose()
  }

  const handleDelete = () => {
    setIsDeleteModalOpen(true)
    handleMenuClose()
  }

  const handleCopyText = async () => {
    if (!content) return

    let plainText = ''
    try {
      const parsed = JSON.parse(content) as Descendant[]

      const extractText = (nodes: Descendant[]): string =>
        nodes
          .map((node) => {
            if (Text.isText(node)) return node.text
            if (SlateElement.isElement(node)) {
              const element: SlateElement & { character?: string } = node
              if (element.character) return `@${element.character}`
              if (element.children) return extractText(element.children)
            }
            return ''
          })
          .join('')

      plainText = extractText(parsed)
    } catch {
      const temp = new DOMParser().parseFromString(content, 'text/html')
      plainText = temp.body.textContent || ''
    }

    try {
      await navigator.clipboard.writeText(plainText.trim())
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = plainText
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  const handleTogglePin = async () => {
    // For direct messages, use the callback prop
    if (type === 'DIRECT_MESSAGE') {
      if (onPinMessage) {
        onPinMessage(id)
        return
      }
      // If onPinMessage is not provided for direct messages, show error
      toast.error('Pin handler not available for direct messages.')
      return
    }

    // For team messages, use the mutation
    if (!pulseId) {
      toast.error('Missing pulse ID.')
      return
    }

    if (updatePinTeamMessage.isPending) return

    try {
      await updatePinTeamMessage.mutateAsync({
        pinned: !isPinned,
        pulseId,
        replyTeamThreadId,
        teamMessageId: id,
      })
      toast.success(`Message ${isPinned ? 'unpinned' : 'pinned'}`)
    } catch (error) {
      console.error('Failed to toggle pin:', error)
      toast.error(`Failed to ${isPinned ? 'unpin' : 'pin'} message`)
    }
  }

  const handleReaction = async ({
    reaction,
    closeEmojiTray = false,
  }: {
    reaction: string
    closeEmojiTray?: boolean
  }) => {
    if (type === 'DIRECT_MESSAGE') {
      // Use callback if provided (for direct messages)
      if (onReaction) {
        onReaction(id, reaction)
        if (closeEmojiTray) handleEmojiClose()
        return
      }

      // Otherwise use mutation directly
      if (!threadId || !organizationId) {
        toast.error('Missing thread ID or organization ID.')
        return
      }

      try {
        toggleDirectMessageReaction.mutate({
          directMessageId: id,
          organizationId,
          reaction,
          threadId,
        })
      } catch (error) {
        console.error('Failed to toggle reaction:', error)
        toast.error(t('failed_to_add_reaction'))
      }

      if (closeEmojiTray) handleEmojiClose()
      return
    }

    // Team message reaction
    if (!pulseId) {
      toast.error(t('missing_pulse_id'))
      return
    }

    try {
      await toggleTeamMessageReaction.mutateAsync({
        pulseId,
        reaction: reaction,
        replyTeamThreadId,
        teamMessageId: id,
      })

      // Scroll entire element into view
      const ReactionTrayEl = document.getElementById(id)

      if (!ReactionTrayEl) return

      ReactionTrayEl.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    } catch (error) {
      console.error('Failed to toggle reaction:', error)
      toast.error(t('failed_to_add_reaction'))
    }

    if (closeEmojiTray) handleEmojiClose()
  }

  const handleReply = () => {
    if (type === 'DIRECT_MESSAGE') {
      if (onReply) {
        onReply({
          content: content ?? '',
          id,
          name,
        })
      } else {
        toast.error('Reply handler not available for direct messages.')
      }
      return
    }

    if (!pulseId) {
      toast.error('Missing pulse ID.')
      return
    }

    updateReplyingToInStore({
      content: content ?? '',
      id: pulseId,
      name,
      teamMessageId: id,
      type,
    })
  }

  const handleMenuItemClick = (
    action: string,
    event?: React.MouseEvent<HTMLElement>,
  ) => {
    switch (action) {
      case 'addReaction':
        if (event) {
          setEmojiAnchorEl(event.currentTarget)
          return // Don't close the main menu - keep anchor element reference
        }
        break
      case 'edit':
        handleEdit()
        break
      case 'delete':
        handleDelete()
        break
      case 'copyText':
        handleCopyText()
        break
      case 'pinMessage':
        handleTogglePin()
        break
      case 'reply':
        handleReply()
        break
    }

    handleMenuClose()
  }

  const PinIcon = isPinned ? PushPin : PushPinOutlined

  return (
    <>
      <Box
        sx={{
          alignItems: 'center',
          bgcolor: alpha(theme.palette.common.white, 0.98),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 2,
          boxShadow:
            '0 4px 12px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          gap: 0.5,
          opacity: isVisible ? 1 : 0,
          position: 'absolute',
          px: 0.5,
          py: 0.5,
          transition: 'opacity 0.2s ease, visibility 0.2s ease',
          ...(isFlipped ? { left: 10, right: 'auto' } : { right: 10 }),
          top: 8,
          zIndex: 50,
        }}
      >
        {/* Quick Reactions */}
        {QUICK_REACTIONS.map((reaction) => (
          <IconButton
            key={reaction}
            onClick={() => handleReaction({ reaction })}
            size="small"
            sx={{
              '&:hover': {
                transform: 'scale(1.1)',
              },
              alignItems: 'center',
              aspectRatio: 1,
              borderRadius: 1.5,
              color: 'inherit',
              display: 'flex',
              justifyContent: 'center',
              p: 0.75,
              transition: 'all 0.2s ease',
            }}
          >
            <Typography fontSize={16} lineHeight={1}>
              {reaction}
            </Typography>
          </IconButton>
        ))}

        <Divider flexItem={true} orientation="vertical" sx={{ my: 0.5 }} />

        <EmojiPickerButton
          iconSx={{ fontSize: 18 }}
          onEmojiClick={(reaction) =>
            handleReaction({ reaction: reaction.emoji })
          }
          size="small"
          sx={{
            borderRadius: 1.5,
            transition: 'all 0.2s ease',
          }}
        />

        <IconButton
          onClick={handleReply}
          size="small"
          sx={{
            borderRadius: 1.5,
            p: 0.75,
            transition: 'all 0.2s ease',
          }}
        >
          <ReplyOutlined sx={{ fontSize: 18 }} />
        </IconButton>

        <IconButton
          onClick={handleMoreClick}
          size="small"
          sx={{
            borderRadius: 1.5,
            p: 0.75,
            transition: 'all 0.2s ease',
          }}
        >
          <MoreVertOutlined sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Main Menu */}
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        onClose={handleMenuClose}
        open={isMenuOpen}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 3,
            boxShadow:
              '0 8px 24px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.1)',
            minWidth: 240,
            mt: 1,
          },
          opacity: shouldHideMainMenu ? 0 : 1,
          pointerEvents: shouldHideMainMenu ? 'none' : 'auto',
          transition: 'opacity 0.15s ease',
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <MenuItem
              disabled={item.disabled}
              key={item.action}
              onClick={(event) => handleMenuItemClick(item.action, event)}
              sx={{
                alignItems: 'center',
                display: 'flex',
                gap: 2,
                justifyContent: 'space-between',
                px: 2.5,
                py: 1.5,
              }}
            >
              <Typography fontSize="small">{item.label}</Typography>
              <Icon
                sx={{ color: 'text.secondary', fontSize: 20, ml: 'auto' }}
              />
            </MenuItem>
          )
        })}

        {/* Pin Message Item */}
        <MenuItem
          disabled={
            type === 'DIRECT_MESSAGE' ? false : updatePinTeamMessage.isPending
          }
          onClick={() => handleMenuItemClick('pinMessage')}
          sx={{
            alignItems: 'center',
            display: 'flex',
            gap: 2,
            justifyContent: 'space-between',
            px: 2.5,
            py: 1.5,
          }}
        >
          <Typography fontSize="small">
            {isPinned ? 'Unpin Message' : 'Pin Message'}
          </Typography>

          {type === 'DIRECT_MESSAGE' ? (
            <PinIcon
              sx={{ color: 'text.secondary', fontSize: 20, ml: 'auto' }}
            />
          ) : updatePinTeamMessage.isPending ? (
            <CircularProgress size={16} sx={{ ml: 'auto' }} />
          ) : (
            <PinIcon
              sx={{ color: 'text.secondary', fontSize: 20, ml: 'auto' }}
            />
          )}
        </MenuItem>

        {(allowEdit || allowDelete) && <Divider sx={{ my: 0.5 }} />}

        {ACTION_MENU_ITEMS.map((item) => {
          const Icon = item.icon
          const isError = item.action === 'delete'

          if (
            (item.action === 'edit' && !allowEdit) ||
            (item.action === 'delete' && !allowDelete)
          ) {
            return null
          }

          return (
            <MenuItem
              disabled={item.disabled}
              key={item.action}
              onClick={() => handleMenuItemClick(item.action)}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                px: 2.5,
                py: 1.5,
                ...(isError && {
                  '&:hover': {
                    bgcolor: alpha(theme.palette.error.main, 0.04),
                  },
                  color: theme.palette.error.main,
                }),
              }}
            >
              <Typography fontSize="small">{item.label}</Typography>
              <Icon sx={{ color: 'inherit', fontSize: 20 }} />
            </MenuItem>
          )
        })}
      </Menu>

      {/* Reaction Emoji Picker Menu */}
      <Menu
        MenuListProps={{ sx: { padding: 0 } }}
        TransitionProps={{ timeout: 150 }}
        anchorEl={emojiAnchorEl}
        onClose={handleEmojiClose}
        open={isEmojiMenuOpen}
        slotProps={{
          paper: {
            sx: {
              '& .epr-category-nav': { display: 'none' },
              '& .epr-emoji-category-label': {
                fontSize: '0.75rem',
                padding: '4px 8px',
              },
              '& .epr-emoji-list': {
                '& .epr-emoji-img': {
                  height: '20px !important',
                  width: '20px !important',
                },
                '& button': { padding: '2px !important' },
                '& span': { fontSize: '20px !important' },
              },
              '& .epr-skin-tones': { display: 'none' },
              backgroundColor: 'transparent',
              boxShadow: 'none',
              overflow: 'visible',
            },
          },
        }}
      >
        <EmojiPicker
          emojiStyle={EmojiStyle.NATIVE}
          height={350}
          lazyLoadEmojis={true}
          onEmojiClick={(reaction) =>
            handleReaction({ closeEmojiTray: true, reaction: reaction.emoji })
          }
          previewConfig={{ showPreview: false }}
        />
      </Menu>

      {/* Delete Modal */}
      <DeleteMessageModal
        isOpen={isDeleteModalOpen}
        message={{
          content: content ?? '',
          gravatar,
          messageDate,
          name,
        }}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => handleDeleteMessage?.(id)}
      />
    </>
  )
}
