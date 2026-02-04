import 'react-quill/dist/quill.snow.css'

import { zodResolver } from '@hookform/resolvers/zod'
import { alpha, Dialog, DialogContent } from '@mui/material'
import { Label, Note, NoteAttachmentInput } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useMemo, useState } from 'react'
import { FieldErrors, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { NoteFormData, noteSchema } from '~/schemas/NoteSchema'

import { useNotes } from '../hooks'
import { NoteCard } from '../NoteCard/NoteCard'
import { DeleteConfirmationModal } from './DeleteNoteModal'

interface NoteModalProps {
  open: boolean
  labels: Label[]
  note: Note | null
  onClose: () => void
  noteId?: string
  createDataSourceFromNote?: (
    noteId: string,
    noteTitle: string,
    noteContent?: string,
  ) => Promise<void>
  isCreatingDataSource?: boolean
  addLabelToPool?: (label: string, color?: string) => void
  onAddLabelToNote?: (noteId: string, label: string) => void
  onRemoveLabelFromNote?: (noteId: string, label: string) => void
}

export const NoteModal = ({
  open,
  note,
  labels,
  onClose,
  noteId,
  createDataSourceFromNote,
  isCreatingDataSource,
  addLabelToPool,
  onAddLabelToNote,
  onRemoveLabelFromNote,
}: NoteModalProps) => {
  const { t } = useTranslation('notes')
  const { updateNote, deleteNote, handleRemoveExistingFile } = useNotes()
  const [fileAttachments, setFileAttachments] = useState<NoteAttachmentInput[]>(
    [],
  )
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [removedFileIds, setRemovedFileIds] = useState<Set<string>>(new Set())

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<NoteFormData>({
    defaultValues: {
      description: '',
      isPinned: false,
      labels: [],
      title: '',
    },
    mode: 'onChange',
    resolver: zodResolver(noteSchema),
  })

  // Watch form values and force NoteCard update when they change
  const {
    title,
    description,
    labels: formLabels,
    isPinned,
  } = useWatch({ control })

  // Create the note object with current form values
  const noteWithFormValues = useMemo(() => {
    if (!note) return null

    const updatedNote = {
      ...note,
      content: description ?? note.content ?? '',
      files: note.files?.filter((file) => !removedFileIds.has(file.id)) || [],
      labels: (formLabels || []).map((labelName) => {
        // Look up the full label object from labels prop (labelPool)
        const fullLabel = labels.find((label) => label.name === labelName)
        return (
          fullLabel || {
            color: undefined,
            id: '',
            name: labelName,
          }
        )
      }),
      pinned: isPinned !== undefined ? isPinned : note.pinned,
      title: title !== undefined ? title : note.title,
    }

    return updatedNote
  }, [note, title, description, formLabels, isPinned, removedFileIds, labels])

  useEffect(() => {
    if (note && open) {
      reset({
        description: note.content ?? '',
        isPinned: note.pinned,
        labels: note.labels?.map((label) => label.name) || [],
        title: note.title,
      })

      setRemovedFileIds(new Set())

      if (note.files && note.files.length > 0) {
        const attachments: NoteAttachmentInput[] = note.files.map((file) => ({
          fileKey: file.path,
          fileName: file.file_name || file.path.split('/').pop() || 'file',
          type: file.type || 'application/octet-stream',
        }))
        setFileAttachments(attachments)
      } else {
        setFileAttachments([])
      }
    }
  }, [note, open, reset])

  const handleSave = handleSubmit((data: NoteFormData) => {
    if (note && noteId) {
      updateNote(
        noteId,
        {
          content: data.description ?? '',
          labels:
            data.labels?.map((labelName) => ({
              color: undefined,
              id: '',
              name: labelName,
            })) || [],
          pinned: data.isPinned,
          title: data.title,
        },
        fileAttachments,
      )
      onClose()
    }
  })

  const handleClose = () => {
    if (note) {
      reset({
        description: note.content ?? '',
        isPinned: note.pinned,
        labels: note.labels?.map((label) => label.name) || [],
        title: note.title,
      })
      setRemovedFileIds(new Set())
      if (note.files && note.files.length > 0) {
        const attachments: NoteAttachmentInput[] = note.files.map((file) => ({
          fileKey: file.path,
          fileName: file.file_name || file.path.split('/').pop() || 'file',
          type: file.type || 'application/octet-stream',
        }))
        setFileAttachments(attachments)
      } else {
        setFileAttachments([])
      }
    }
    onClose()
  }

  const handleFileChange = (attachments: NoteAttachmentInput[]) => {
    setFileAttachments((prev) => {
      const isSame =
        prev.length === attachments.length &&
        prev.every(
          (a, i) => JSON.stringify(a) === JSON.stringify(attachments[i]),
        )
      return isSame ? prev : attachments
    })
  }

  const handleRemoveExistingFileFromModal = (fileId: string) => {
    if (noteId) {
      handleRemoveExistingFile(fileId)
      setRemovedFileIds((prev) => new Set([...prev, fileId]))
      setFileAttachments([])
    }
  }

  const handleAddLabel = (label: string) => {
    if (note && noteId) {
      const currentLabels = formLabels || []
      if (!currentLabels.includes(label)) {
        const updatedLabels = [...currentLabels, label]
        setValue('labels', updatedLabels, { shouldValidate: true })
        if (onAddLabelToNote) {
          onAddLabelToNote(noteId, label)
        } else {
          updateNote(
            noteId,
            {
              labels: updatedLabels.map((labelName) => ({
                color: undefined,
                id: '',
                name: labelName,
              })),
            },
            fileAttachments,
          )
        }
      }
    }
  }

  const handleRemoveLabel = (label: string) => {
    if (note && noteId) {
      const currentLabels = formLabels || []
      const updatedLabels = currentLabels.filter((l) => l !== label)
      setValue('labels', updatedLabels, { shouldValidate: true })
      if (onRemoveLabelFromNote) {
        onRemoveLabelFromNote(noteId, label)
      } else {
        updateNote(
          noteId,
          {
            labels: updatedLabels.map((labelName) => ({
              color: undefined,
              id: '',
              name: labelName,
            })),
          },
          fileAttachments,
        )
      }
    }
  }

  const handleTogglePin = () => {
    if (note && noteId) {
      const newPinnedValue = !isPinned
      setValue('isPinned', newPinnedValue, { shouldValidate: true })
      updateNote(
        noteId,
        {
          pinned: newPinnedValue,
        },
        fileAttachments,
      )
    }
  }

  const handleDelete = () => {
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (noteId) {
      await deleteNote(noteId)
      setDeleteModalOpen(false)
      onClose()
    }
  }

  if (!note || !noteWithFormValues) return null

  return (
    <Dialog
      PaperProps={{
        sx: {
          bgcolor: 'white',
          borderRadius: 2,
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
          display: 'flex',
          flexDirection: 'column',
          height: 'auto',
          left: '50%',
          maxHeight: '90vh',
          maxWidth: 1280,
          position: 'absolute',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '75%',
        },
      }}
      disableAutoFocus={true}
      disableEnforceFocus={true}
      fullWidth={false}
      maxWidth={false}
      onClose={handleClose}
      open={open}
    >
      <DialogContent sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
        <NoteCard
          addLabelToPool={addLabelToPool}
          canCreateDataSource={true}
          createDataSourceFromNote={createDataSourceFromNote}
          editMode={true}
          errors={errors as FieldErrors<Record<string, unknown>>}
          isCreatingDataSource={isCreatingDataSource}
          isValid={isValid}
          labelPool={labels}
          note={noteWithFormValues}
          onAddLabel={handleAddLabel}
          onClose={handleClose}
          onContentChange={(value) =>
            setValue('description', value, { shouldValidate: true })
          }
          onDelete={handleDelete}
          onFileChange={handleFileChange}
          onRemoveExistingFile={handleRemoveExistingFileFromModal}
          onRemoveLabel={handleRemoveLabel}
          onSave={handleSave}
          onTitleChange={(value) =>
            setValue('title', value, { shouldValidate: true })
          }
          onTogglePin={handleTogglePin}
        />
      </DialogContent>
      <DeleteConfirmationModal
        handleClose={() => setDeleteModalOpen(false)}
        isOpen={deleteModalOpen}
        message={t('delete_note_confirmation')}
        onConfirmDelete={handleConfirmDelete}
        title={t('delete_note', { ns: 'notes' })}
      />
    </Dialog>
  )
}
