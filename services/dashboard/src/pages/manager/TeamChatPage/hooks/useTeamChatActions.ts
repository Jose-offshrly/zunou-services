import { useDeleteTeamMessageMutation } from '@zunou-queries/core/hooks/useDeleteTeamMessageMutation'
import { useUpdatePinTeamMessageMutation } from '@zunou-queries/core/hooks/useUpdatePinTeamMessage.ts'
import { useCallback } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

interface UseTeamChatActionsProps {
  pulseId?: string
  currentReplyThreadId: string | null
  refetchMessages: () => void
}

export const useTeamChatActions = ({
  pulseId,
  currentReplyThreadId,
  refetchMessages,
}: UseTeamChatActionsProps) => {
  const { t } = useTranslation(['chat'])

  const { mutateAsync: deleteTeamMessage, isPending: isDeleting } =
    useDeleteTeamMessageMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { mutateAsync: updatePinTeamMessage } = useUpdatePinTeamMessageMutation(
    {
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    },
  )

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      try {
        if (!pulseId) {
          toast.error(t('team_chat_not_initialized', { ns: 'chat' }))
          return
        }

        await deleteTeamMessage({
          pulseId,
          replyTeamThreadId: currentReplyThreadId || undefined,
          teamMessageId: messageId,
        })

        toast.success(t('message_deleted_successfully', { ns: 'chat' }))
        refetchMessages()
      } catch (error) {
        toast.error(t('failed_to_delete_message', { ns: 'chat' }))
      }
    },
    [deleteTeamMessage, pulseId, currentReplyThreadId, refetchMessages, t],
  )

  const handlePinMessage = useCallback(
    async (messageId: string) => {
      if (!pulseId) {
        toast.error(t('missing_pulse_id', { ns: 'chat' }))
        return
      }

      try {
        await updatePinTeamMessage({
          pinned: true,
          pulseId,
          replyTeamThreadId: currentReplyThreadId || undefined,
          teamMessageId: messageId,
        })
        toast.success(t('message_pinned', { ns: 'chat' }))
      } catch (error) {
        console.error('Failed to pin message:', error)
        toast.error(t('failed_to_pin_message', { ns: 'chat' }))
      }
    },
    [pulseId, updatePinTeamMessage, t],
  )

  const handleUnpinMessage = useCallback(
    async (messageId: string) => {
      if (!pulseId) {
        toast.error(t('missing_pulse_id', { ns: 'chat' }))
        return
      }

      try {
        await updatePinTeamMessage({
          pinned: false,
          pulseId,
          replyTeamThreadId: currentReplyThreadId || undefined,
          teamMessageId: messageId,
        })
        toast.success(t('message_unpinned', { ns: 'chat' }))
      } catch (error) {
        console.error('Failed to unpin message:', error)
        toast.error(t('failed_to_unpin_message', { ns: 'chat' }))
      }
    },
    [pulseId, updatePinTeamMessage, t],
  )

  return {
    handleDeleteMessage,
    handlePinMessage,
    handleUnpinMessage,
    isDeleting,
  }
}
