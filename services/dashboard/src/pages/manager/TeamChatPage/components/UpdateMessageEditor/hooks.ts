import 'react-quill/dist/quill.snow.css'

import { zodResolver } from '@hookform/resolvers/zod'
import { File } from '@zunou-graphql/core/graphql'
import { useUpdateDirectMessageMutation } from '@zunou-queries/core/hooks/useUpdateDirectMessageMutation'
import { useUpdateTeamMessageMutation } from '@zunou-queries/core/hooks/useUpdateTeamMessageMutation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import { MentionType } from '~/components/ui/form/SlateInput/custom-types'
import { useEditing } from '~/context/MessageListContext'
import {
  UpdateMessageInput,
  updateMessageSchema,
} from '~/schemas/UpdateMessageSchema'
import { usePulseStore } from '~/store/usePulseStore'

interface UseHooksProps {
  id: string
  content: string
  organizationId?: string
  onUpdateComplete?: () => void
  replyTeamThreadId?: string
  files?: File[]
}

export const useHooks = ({
  id,
  content,
  organizationId,
  onUpdateComplete,
  replyTeamThreadId,
  files = [],
}: UseHooksProps) => {
  const { pulseId } = useParams()
  const { setCurrentEditingId } = useEditing()
  const { pulseMembers } = usePulseStore()
  const isDirectMessage = !!organizationId

  // TODO: integrate notify mentioned users
  const [_mentions, setMentions] = useState<MentionType[]>([])

  const { control, handleSubmit } = useForm<UpdateMessageInput>({
    defaultValues: {
      message: content,
    },
    mode: 'onChange',
    resolver: zodResolver(updateMessageSchema),
  })

  const {
    mutateAsync: updateTeamMessage,
    isPending: isPendingTeamMessageUpdate,
  } = useUpdateTeamMessageMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const {
    mutateAsync: updateDirectMessage,
    isPending: isPendingDirectMessageUpdate,
  } = useUpdateDirectMessageMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const onUpdateMessage = async (messageId: string, content: string) => {
    try {
      if (isDirectMessage && organizationId) {
        await updateDirectMessage({
          content,
          directMessageId: messageId,
          organizationId,
        })
      } else {
        await updateTeamMessage({
          content,
          files: files.map((file) => ({
            fileKey: file.path,
            fileName: file.file_name ?? '',
            type: file.type ?? '',
          })),
          pulseId,
          replyTeamThreadId,
          teamMessageId: messageId,
        })
      }

      toast.success('Successfully updated message')
      onUpdateComplete?.()
    } catch (err) {
      toast.error('Failed to update message')
    }
  }

  const handleSubmitEdit = handleSubmit(
    async ({ message }: UpdateMessageInput) => {
      await onUpdateMessage(id, message)
      setCurrentEditingId(null)
    },
  )

  const handleCancel = () => setCurrentEditingId(null)

  const isPending = isDirectMessage
    ? isPendingDirectMessageUpdate
    : isPendingTeamMessageUpdate

  return {
    control,
    handleCancel,
    handleSubmitEdit,
    isPending,
    mentionSuggestions: isDirectMessage
      ? []
      : pulseMembers.map((m) => ({
          id: m.userId,
          name: m.user.name,
        })),
    setMentions,
  }
}
