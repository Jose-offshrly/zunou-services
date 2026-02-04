import { ContentCopyOutlined, DeleteOutline } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import { SavedMessage } from '@zunou-graphql/core/graphql'
import { useDeleteSavedMessageMutation } from '@zunou-queries/core/hooks/useDeleteSavedMessageMutation'
import { theme } from '@zunou-react/services/Theme'
import toast from 'react-hot-toast'

import { CustomModal } from '~/components/ui/CustomModal'
import { usePulseStore } from '~/store/usePulseStore'
import { formatDateAndTime } from '~/utils/formatDateAndTime'

import { MessageContent } from '../../threads/MessageListV2/components/MessageContent'
import { useContentParser } from '../../threads/MessageListV2/hooks/useContentParser'

interface SavedMessageModalProps {
  isOpen: boolean
  savedMessage: SavedMessage | null
  onClose: () => void
  onDataSourceClick: (dataSourceId: string, dataSourceType: string) => void
}

interface ContentItem {
  page_number: number
  data_source_id: string
  data_source_type: string
  text_excerpt: string
  text: string
}

interface Reference {
  summary: string
  content: ContentItem[]
}

export const SavedMessageModal = ({
  isOpen,
  savedMessage,
  onClose,
  onDataSourceClick,
}: SavedMessageModalProps) => {
  const { activeThreadId } = usePulseStore()

  const { mutateAsync: deleteSavedMessage } = useDeleteSavedMessageMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { parseContent } = useContentParser()

  const parsedContent = parseContent(savedMessage?.data.content ?? '')

  const truncate = (text: string, maxLength: number): string =>
    text.length > maxLength ? text.substring(0, maxLength) + '...' : text

  const handleCopy = async () => {
    if (!savedMessage) return
    try {
      await navigator.clipboard.writeText(
        parsedContent?.message || savedMessage.data.content || '',
      )
      toast.success('Text copied')
    } catch (err) {
      toast.error('Failed to copy text')
      console.error('Failed to copy text:', err)
    }
  }

  const handleDelete = async () => {
    if (!savedMessage) return
    try {
      if (!savedMessage.id) {
        throw new Error('No saved message ID found')
      }
      await deleteSavedMessage({ savedMessageId: savedMessage.id })
      toast.success('Successfully deleted saved message!')
      onClose()
    } catch (err) {
      toast.error('Failed to delete saved message')
      console.error('Deleting saved message failed: ', err)
    }
  }

  const parseMessageContent = (content: string): Reference => {
    try {
      return typeof content === 'string' ? JSON.parse(content) : content
    } catch (err) {
      return { content: [], summary: '' }
    }
  }

  let updatedSubheader = ''
  let modalTitle = 'Saved Message'
  let references: Reference = { content: [], summary: '' }

  if (savedMessage) {
    const { updated_at, data } = savedMessage

    try {
      const jsonContent = JSON.parse(data.content) as SavedMessage

      updatedSubheader = `Updated: ${formatDateAndTime(updated_at)}`
      modalTitle = jsonContent.thread?.pulse?.name ?? modalTitle
    } catch (e) {
      updatedSubheader = `Updated: ${formatDateAndTime(updated_at)}`
      modalTitle = savedMessage.thread?.pulse?.name ?? modalTitle
      references = parseMessageContent(data.content)
    }
  }

  return (
    <CustomModal
      headerActions={
        savedMessage
          ? [
              { icon: ContentCopyOutlined, onClick: handleCopy },
              { icon: DeleteOutline, onClick: handleDelete },
            ]
          : []
      }
      isOpen={isOpen}
      onClose={onClose}
      subheader={updatedSubheader}
      title={modalTitle}
    >
      {savedMessage ? (
        <>
          <MessageContent
            disableInteraction={true}
            parsedContent={parsedContent}
            showTextOnly={true}
            threadId={activeThreadId}
          />
          <Stack spacing={2}>
            {references?.content.map((reference, index) => (
              <Stack
                alignItems="start"
                direction="row"
                key={index}
                letterSpacing={1.5}
                onClick={() => {
                  if (reference.data_source_id) {
                    onDataSourceClick(
                      reference.data_source_id,
                      reference.data_source_type,
                    )
                    onClose()
                  }
                }}
                p={1}
                spacing={1.5}
                sx={{
                  '&:hover': { bgcolor: '#f5f5f5' },
                  bgcolor: 'white',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 2,
                  cursor: reference.data_source_id ? 'pointer' : 'default',
                }}
              >
                <Stack
                  alignItems="center"
                  bgcolor={theme.palette.secondary.main}
                  borderRadius="50%"
                  color="white"
                  display="flex"
                  height={24}
                  justifyContent="center"
                  width={24}
                >
                  <Typography color="inherit" fontWeight={600} variant="body2">
                    {index + 1}
                  </Typography>
                </Stack>
                <Stack
                  alignItems="start"
                  flexDirection="column"
                  justifyContent="start"
                >
                  <Typography fontSize={14} fontWeight={600}>
                    {truncate(reference.text, 105)}
                  </Typography>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </>
      ) : (
        <Typography>No saved message available.</Typography>
      )}
    </CustomModal>
  )
}
