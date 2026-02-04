import 'react-quill/dist/quill.snow.css'

import { File } from '@zunou-graphql/core/graphql'
import { Form } from '@zunou-react/components/form'

import { SlateInput } from '~/components/ui/form/SlateInput'

import { useHooks } from './hooks'

interface UpdateMessageEditorProps {
  id: string
  content: string
  organizationId?: string
  onUpdateComplete?: () => void
  replyTeamThreadId?: string
  files?: File[]
}

export const UpdateMessageEditor = ({
  id,
  content,
  organizationId,
  onUpdateComplete,
  replyTeamThreadId,
  files,
}: UpdateMessageEditorProps) => {
  const {
    isPending,
    control,
    handleCancel,
    handleSubmitEdit,
    mentionSuggestions,
    setMentions,
  } = useHooks({
    content,
    files,
    id,
    onUpdateComplete,
    organizationId,
    replyTeamThreadId,
  })

  return (
    <Form
      maxWidth="xl"
      onSubmit={handleSubmitEdit}
      sx={{ padding: 0, width: '100%' }}
    >
      <SlateInput
        active={true}
        control={control}
        disabledSubmit={isPending}
        isLoading={isPending}
        mentionSuggestions={mentionSuggestions}
        mode="edit"
        name="message"
        onCancel={handleCancel}
        setMentions={setMentions}
        type="TEAM_CHAT"
      />
    </Form>
  )
}
