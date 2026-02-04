import 'react-quill/dist/quill.snow.css'

import { Stack } from '@mui/system'
import { Note } from '@zunou-graphql/core/graphql'
import { useGetNotesLabelsQuery } from '@zunou-queries/core/hooks/useGetNotesLabelsQuery'
import { Controller, useFormContext } from 'react-hook-form'

import { NoteCard } from '~/pages/manager/NotesPage/NoteCard/NoteCard'

interface Props {
  pulseId: string
}

export default function NoteForm({ pulseId }: Props) {
  const {
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext()

  // Watch form values
  const noteTitle = watch('note_title') || ''
  const noteDescription = watch('note_description') || ''
  const notePinned = watch('note_pinned') || false
  const noteLabels = watch('note_labels') || []
  const noteFiles = watch('note_files') || []

  const { data: labelData } = useGetNotesLabelsQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { pulseId },
  })

  const labelPool = labelData?.labels ?? []

  // Create a mock note object that syncs with form values
  const mockNote: Note = {
    content: noteDescription,
    files: noteFiles,
    id: '',
    labels: noteLabels.map((label: string | { id: string; name: string }) =>
      typeof label === 'string' ? { id: label, name: label } : label,
    ),
    pinned: notePinned,
    position: '0',
    title: noteTitle,
    updatedAt: new Date().toISOString(),
  }

  const handleTitleChange = (val: string) => {
    setValue('note_title', val, { shouldDirty: true, shouldValidate: true })
  }

  const handleContentChange = (val: string) => {
    setValue('note_description', val, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const handleSave = () => {
    console.log('Save note:', {
      content: noteDescription,
      files: noteFiles,
      labels: noteLabels,
      pinned: notePinned,
      title: noteTitle,
    })
  }

  const handleAddLabel = (label: string) => {
    const updatedLabels = [...noteLabels, { id: label, name: label }]
    setValue('note_labels', updatedLabels, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const handleRemoveLabel = (labelId: string) => {
    const updatedLabels = noteLabels.filter(
      (l: string | { id: string; name: string }) => {
        // Handle both string and object formats
        if (typeof l === 'string') {
          return l !== labelId
        }
        return l.id !== labelId
      },
    )
    setValue('note_labels', updatedLabels, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }
  const addLabelToPool = (label: string, color?: string) => {
    console.log('Add label to pool:', label, color)
    // Your add label to pool logic here
  }

  const handleTogglePin = () => {
    const newPinnedState = !notePinned
    setValue('note_pinned', newPinnedState, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const handleFileChange = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attachments: any[],
  ) => {
    setValue('note_files', attachments, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const handleDelete = () => {
    console.log('Delete note')
  }

  return (
    <Stack gap={2}>
      <Controller
        control={control}
        defaultValue=""
        name="note_title"
        render={() => (
          <Controller
            control={control}
            defaultValue=""
            name="note_description"
            render={() => (
              <Controller
                control={control}
                defaultValue={false}
                name="note_pinned"
                render={() => (
                  <NoteCard
                    addLabelToPool={addLabelToPool}
                    canCreateDataSource={false}
                    editMode={true}
                    errors={errors}
                    hideAttachment={true}
                    hideBorder={true}
                    hideClose={true}
                    hideDelete={true}
                    hideSend={true}
                    isValid={!errors.note_title && !errors.note_description}
                    labelPool={labelPool}
                    note={mockNote}
                    onAddLabel={handleAddLabel}
                    onContentChange={handleContentChange}
                    onDelete={handleDelete}
                    onFileChange={handleFileChange}
                    onRemoveLabel={handleRemoveLabel}
                    onSave={handleSave}
                    onTitleChange={handleTitleChange}
                    onTogglePin={handleTogglePin}
                  />
                )}
              />
            )}
          />
        )}
      />
    </Stack>
  )
}
