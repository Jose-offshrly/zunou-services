import { useQueryClient } from '@tanstack/react-query'
import {
  CreateNoteInput,
  Label,
  Note,
  NoteAttachmentInput,
  NoteOrderInput,
  PulseCategory,
  UpdateNoteInput,
} from '@zunou-graphql/core/graphql'
import { useCreateNoteDataSourceMutation } from '@zunou-queries/core/hooks/useCreateNoteDataSourceMutation'
import { useCreateNotesLabelMutation } from '@zunou-queries/core/hooks/useCreateNotesLabelMutation'
import { useCreateNotesMutation } from '@zunou-queries/core/hooks/useCreateNotesMutation'
import { useDeleteNoteAttachmentMutation } from '@zunou-queries/core/hooks/useDeleteNoteAttachmentMutation'
import { useDeleteNotesLabelMutation } from '@zunou-queries/core/hooks/useDeleteNotesLabelMutation'
import { useDeleteNotesMutation } from '@zunou-queries/core/hooks/useDeleteNotesMutation'
import { useGetNotesLabelsQuery } from '@zunou-queries/core/hooks/useGetNotesLabelsQuery'
import { useGetPaginatedNotesQuery } from '@zunou-queries/core/hooks/useGetPaginatedNotesQuery'
import { useUpdateNoteOrderMutation } from '@zunou-queries/core/hooks/useUpdateNoteOrderMutation'
import { useUpdateNotesLabelMutation } from '@zunou-queries/core/hooks/useUpdateNotesLabelMutation'
import { useUpdateNotesMutation } from '@zunou-queries/core/hooks/useUpdateNotesMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { NoteFormData } from '~/schemas/NoteSchema'
import { usePulseStore } from '~/store/usePulseStore'

import { convertNoteFilesToAttachments } from './utils/fileUtils'

export const useNotes = () => {
  const { t } = useTranslation('notes')
  const { organizationId, pulseId } = useParams<{
    organizationId: string
    pulseId: string
  }>()
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const { pulseCategory, pulse } = usePulseStore()

  const orderKey = `notes-order-${pulseId}`
  const noteOrderRef = useRef<Map<string, number>>(new Map())

  // Add state to force re-render when order changes
  const [orderVersion, setOrderVersion] = useState(0)

  useEffect(() => {
    const storedOrder = sessionStorage.getItem(orderKey)
    if (storedOrder) {
      try {
        const orderData = JSON.parse(storedOrder)
        noteOrderRef.current = new Map(
          Object.entries(orderData as Record<string, number>),
        )
      } catch (error) {
        console.error(t('loading_note_order_error'), error)
        noteOrderRef.current.clear()
      }
    }
  }, [orderKey, t])

  const saveOrderToStorage = () => {
    if (noteOrderRef.current.size > 0) {
      const orderData = Object.fromEntries(noteOrderRef.current)
      sessionStorage.setItem(orderKey, JSON.stringify(orderData))
    } else {
      sessionStorage.removeItem(orderKey)
    }
  }

  const isPersonalPulse = pulseCategory === PulseCategory.Personal
  const assigneeId = isPersonalPulse && user?.id ? user.id : undefined

  const {
    data: notesData,
    isLoading: isLoadingNotes,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useGetPaginatedNotesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: !!organizationId && (isPersonalPulse ? true : !!pulseId),
    variables: {
      organizationId: organizationId!,
      ...(isPersonalPulse ? {} : { pulseId: pulseId! }),
      ...(assigneeId && { userId: assigneeId }),
      perPage: 20,
      viewAllLabels: isPersonalPulse,
    },
  })

  const { mutateAsync: createNote, isPending: isCreatingNote } =
    useCreateNotesMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { mutateAsync: updateNote, isPending: isUpdatingNote } =
    useUpdateNotesMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { mutateAsync: deleteNote, isPending: isDeletingNote } =
    useDeleteNotesMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { mutateAsync: updateNoteOrder, isPending: isUpdatingNoteOrder } =
    useUpdateNoteOrderMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { mutateAsync: createNoteDataSource, isPending: isCreatingDataSource } =
    useCreateNoteDataSourceMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const notes = useMemo(() => {
    // Flatten all pages into a single array
    const rawNotes = notesData?.pages.flatMap((page) => page.data) || []

    if (noteOrderRef.current.size > 0) {
      return [...rawNotes].sort((a, b) => {
        const aPos = noteOrderRef.current.get(a.id) ?? 0
        const bPos = noteOrderRef.current.get(b.id) ?? 0
        return aPos - bPos
      })
    }

    return rawNotes
  }, [notesData?.pages, orderVersion])

  const isLoading =
    isLoadingNotes ||
    isCreatingNote ||
    isUpdatingNote ||
    isDeletingNote ||
    isUpdatingNoteOrder ||
    isCreatingDataSource ||
    isFetchingNextPage

  const addNote = async (
    noteData: NoteFormData,
    attachments?: NoteAttachmentInput[],
  ) => {
    if (!organizationId || !pulseId || !user?.id) {
      toast.error(t('required_note_data_missing'))
      return
    }

    if (!noteData.title || noteData.title.trim() === '') {
      toast.error(t('note_title_required'))
      return
    }

    try {
      const content = noteData.description ?? ''

      const cleanAttachments = attachments
        ? attachments.map((attachment) => ({
            fileKey: attachment.fileKey,
            fileName: attachment.fileName,
            type: attachment.type,
          }))
        : []

      const createNoteInput: CreateNoteInput = {
        content: content,
        labels: noteData.labels as unknown as string[],
        organizationId,
        paths: cleanAttachments,
        pinned: noteData.isPinned,
        pulseId,
        title: noteData.title,
        userId: user.id,
      }

      await createNote(createNoteInput)

      if (noteOrderRef.current.size > 0) {
        noteOrderRef.current.clear()
        saveOrderToStorage()
      }

      queryClient.invalidateQueries({ queryKey: ['paginatedNotes'] })

      toast.success(t('create_note_success'))
    } catch (error) {
      console.error(t('create_note_error'), error)
      toast.error(t('create_note_error'))
    }
  }

  const updateNoteById = async (
    noteId: string,
    noteData: Partial<Note>,
    attachments?: NoteAttachmentInput[],
  ) => {
    if (!organizationId) {
      toast.error(t('required_note_data_missing'))
      return
    }

    // Find the existing note to get the current title if not provided
    const existingNote = notes.find((n) => n.id === noteId)
    if (!existingNote) {
      toast.error(t('note_not_found'))
      return
    }

    // Use the note's original pulseId, or fallback to URL param if not available
    // Note: pulseId is added to GraphQL schema but types may not be regenerated yet
    const notePulseId =
      (existingNote as Note & { pulseId?: string }).pulseId || pulseId
    if (!notePulseId) {
      toast.error(t('required_note_data_missing'))
      return
    }

    if (
      noteData.title !== undefined &&
      (!noteData.title || noteData.title.trim() === '')
    ) {
      toast.error(t('note_title_required'))
      return
    }

    const cleanAttachments = attachments
      ? attachments.map((attachment) => ({
          fileKey: attachment.fileKey,
          fileName: attachment.fileName,
          type: attachment.type,
        }))
      : []

    try {
      const updateNoteInput: UpdateNoteInput = {
        id: noteId,
        organizationId,
        pulseId: notePulseId,
        title:
          noteData.title !== undefined ? noteData.title : existingNote.title,
        ...(noteData.content !== undefined && { content: noteData.content }),
        ...(noteData.pinned !== undefined && { pinned: noteData.pinned }),
        ...(noteData.labels !== undefined && {
          labels: Array.isArray(noteData.labels)
            ? noteData.labels
                .map((label) => {
                  if (typeof label === 'string') {
                    const foundLabel = labels.find((l) => l.name === label)
                    return foundLabel?.id
                  } else {
                    if (label.id && label.id !== '') {
                      return label.id
                    } else {
                      const foundLabel = labels.find(
                        (l) => l.name === label.name,
                      )
                      return foundLabel?.id
                    }
                  }
                })
                .filter((id): id is string => !!id)
            : [],
        }),
        ...(attachments !== undefined && { paths: cleanAttachments }),
      }

      await updateNote(updateNoteInput)

      queryClient.invalidateQueries({ queryKey: ['paginatedNotes'] })
    } catch (error) {
      console.error(t('update_note_error'), error)
      toast.error(t('update_note_error'))
    }
  }

  const handleRemoveExistingFile = async (fileId: string) => {
    if (!organizationId || !pulseId) {
      toast.error(t('required_note_data_missing'))
      return
    }

    try {
      await deleteNoteAttachment({ fileId })
      queryClient.invalidateQueries({ queryKey: ['paginatedNotes'] })
      toast.success(t('remove_file_success'))
    } catch (error) {
      console.error(t('remove_file_error'), error)
      toast.error(t('remove_file_error'))
    }
  }

  const deleteNoteById = async (noteId: string) => {
    try {
      await deleteNote({ noteId })

      if (noteOrderRef.current.has(noteId)) {
        noteOrderRef.current.delete(noteId)
        saveOrderToStorage()
      }

      toast.success(t('delete_note_success'))
    } catch (error) {
      console.error(t('delete_note_error'), error)
      toast.error(t('delete_note_error'))
    }
  }

  const togglePin = async (noteId: string) => {
    const note = notes.find((n) => n.id === noteId)
    if (!note) return

    try {
      const existingAttachments = convertNoteFilesToAttachments(note)

      await updateNoteById(
        noteId,
        {
          pinned: !note.pinned,
        },
        existingAttachments,
      )

      if (noteOrderRef.current.size > 0) {
        noteOrderRef.current.clear()
        saveOrderToStorage()
      }
    } catch (error) {
      console.error('', error)
      toast.error(t('update_pint_status_error'))
    }
  }

  const reorderNotes = (noteOrderInputs: NoteOrderInput[]) => {
    try {
      // 1. IMMEDIATELY update the local order
      noteOrderInputs.forEach((input) => {
        noteOrderRef.current.set(input.id, input.position)
      })

      // 2. Save to storage
      saveOrderToStorage()

      // 3. Force the notes memo to recompute with new order
      setOrderVersion((v) => v + 1)

      // 4. Make API call in background (don't await)
      updateNoteOrder(noteOrderInputs)
        .then(() => {
          // 5. Invalidate to sync with server after success
          queryClient.invalidateQueries({ queryKey: ['paginatedNotes'] })
        })
        .catch((error) => {
          console.error(t('reorder_notes_error'), error)
          toast.error(t('reorder_notes_error'))

          // Rollback on error
          noteOrderRef.current.clear()
          saveOrderToStorage()
          setOrderVersion((v) => v + 1)
          queryClient.invalidateQueries({ queryKey: ['paginatedNotes'] })
        })
    } catch (error) {
      console.error(t('reorder_notes_error'), error)
      toast.error(t('reorder_notes_error'))

      // Rollback
      noteOrderRef.current.clear()
      saveOrderToStorage()
      setOrderVersion((v) => v + 1)
      queryClient.invalidateQueries({ queryKey: ['paginatedNotes'] })
    }
  }

  const coreUrl = import.meta.env.VITE_CORE_GRAPHQL_URL
  const currentPulseId = pulseId || pulse?.id

  // Get all labels when viewAll is true (for notes)
  // This should ONLY run for personal pulses to get all org-wide labels
  const { data: labelData } = useGetNotesLabelsQuery({
    coreUrl,
    enabled: !!currentPulseId && isPersonalPulse,
    variables: {
      pulseId: currentPulseId,
      viewAll: true,
    },
  })

  // Get only current pulse labels (for managing labels)
  // - Personal pulse: only personal pulse labels
  // - Non-personal pulse: only that pulse's labels
  const { data: currentPulseLabelData } = useGetNotesLabelsQuery({
    coreUrl,
    enabled: !!currentPulseId,
    variables: {
      pulseId: currentPulseId,
      viewAll: false,
    },
  })

  const { mutateAsync: createLabelMutation } = useCreateNotesLabelMutation({
    coreUrl,
  })
  const { mutateAsync: updateLabelMutation } = useUpdateNotesLabelMutation({
    coreUrl,
  })
  const { mutateAsync: deleteLabelMutation } = useDeleteNotesLabelMutation({
    coreUrl,
  })
  const { mutateAsync: deleteNoteAttachment } = useDeleteNoteAttachmentMutation(
    { coreUrl },
  )

  const createLabel = async (name: string, color?: string) => {
    try {
      const existingLabel = manageLabels.find(
        (label) => label.name.toLowerCase() === name.toLowerCase(),
      )

      if (existingLabel) {
        toast.error(t('label_already_exists'))
        return
      }

      const labelsQueryKey = ['labels', pulseId]
      queryClient.setQueryData(
        labelsQueryKey,
        (old: { labels: Label[] } | undefined) => {
          if (!old?.labels) return old

          const newLabel = {
            color: color || '',
            id: `temp-${Date.now()}`,
            name,
            pulse_id: pulseId!,
          }

          return {
            ...old,
            labels: [...old.labels, newLabel],
          }
        },
      )

      await createLabelMutation({
        color: color || '',
        name,
        pulse_id: pulseId!,
      })

      queryClient.invalidateQueries({
        queryKey: ['labels', pulseId],
      })

      toast.success(t('create_label_success'))
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t('create_label_error'))
    }
  }

  const updateLabel = async (id: string, name: string, color?: string) => {
    try {
      const oldLabel = manageLabels.find((label) => label.id === id)
      if (!oldLabel) {
        toast.error(t('label_not_found'))
        return
      }

      const updateData: {
        id: string
        name: string
        color?: string
        pulse_id: string
      } = {
        id,
        name,
        pulse_id: pulseId!,
      }

      if (oldLabel.color !== color) {
        updateData.color = color
      }

      await updateLabelMutation(updateData)

      queryClient.invalidateQueries({ queryKey: ['paginatedNotes'] })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t('update_label_error'))
      queryClient.invalidateQueries({ queryKey: ['paginatedNotes'] })
    }
  }

  const deleteLabel = async (id: string) => {
    try {
      const labelToDelete = manageLabels.find((label) => label.id === id)
      if (!labelToDelete) {
        toast.error(t('label_not_found'))
        return
      }

      await deleteLabelMutation({ id })

      queryClient.invalidateQueries({ queryKey: ['paginatedNotes'] })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t('delete_label_error'))
      queryClient.invalidateQueries({ queryKey: ['paginatedNotes'] })
    }
  }

  // When viewAll is true and in personal pulse:
  // - allLabels: all labels (for notes) - only populated for personal pulses
  // - currentPulseLabels: only labels from current pulse (for managing labels) - populated for all pulses
  const allLabels = labelData?.labels || []
  const currentPulseLabels = currentPulseLabelData?.labels || []

  const labels = isPersonalPulse ? allLabels : currentPulseLabels // All org labels for personal pulse, pulse-specific for others
  const manageLabels = currentPulseLabels // Only labels from current pulse for managing

  const addLabelToNoteOptimistic = (noteId: string, labelName: string) => {
    const note = notes.find((n) => n.id === noteId)
    if (
      note &&
      labelName &&
      !note.labels?.some((label) => label.name === labelName)
    ) {
      const newLabels = [
        ...(note.labels || []),
        { color: undefined, id: '', name: labelName },
      ]

      const existingAttachments = convertNoteFilesToAttachments(note)

      updateNoteById(
        noteId,
        {
          labels: newLabels,
        },
        existingAttachments,
      ).catch((err) => {
        console.error(t('add_note_label_error'), err)
        toast.error(t('add_note_label_error'))
      })
    }
  }

  const removeLabelFromNoteOptimistic = (noteId: string, labelName: string) => {
    const note = notes.find((n) => n.id === noteId)
    if (note) {
      const originalLabels = note.labels || []
      const newLabels = originalLabels.filter(
        (label) => label.name !== labelName,
      )

      const existingAttachments = convertNoteFilesToAttachments(note)

      updateNoteById(
        noteId,
        {
          labels: newLabels,
        },
        existingAttachments,
      ).catch((error) => {
        console.error(t('remove_label_error'), error)
        toast.error(t('remove_label_error'))
      })
    }
  }

  const createDataSourceFromNote = async (
    noteId: string,
    noteTitle: string,
    noteContent?: string,
  ) => {
    if (!organizationId || !pulseId) {
      toast.error(t('required_note_data_missing'))
      return
    }

    if (!noteTitle || !noteContent) {
      toast.error(t('note_title_content_required'))
      return
    }

    if (isCreatingDataSource) {
      return
    }

    const note = notes.find((n) => n.id === noteId)
    if (note?.dataSource) {
      toast.error(t('data_source_already_exists'))
      return
    }

    try {
      const input = {
        description: noteContent,
        name: noteTitle,
        noteId,
        organizationId,
        pulseId,
      }

      await createNoteDataSource(input)
      toast.success(t('create_data_source_success'))
    } catch (error) {
      console.error(t('create_data_source_error'), error)
      toast.error(t('create_data_source_error'))
    }
  }

  return {
    addLabelToNoteOptimistic,
    addNote,
    createDataSourceFromNote,
    createLabel,
    deleteLabel,
    deleteNote: deleteNoteById,
    fetchNextPage,
    handleRemoveExistingFile,
    hasNextPage,
    isCreatingDataSource,
    isFetchingNextPage,
    isLoading,
    isPersonalPulse,
    labels,
    manageLabels,
    notes,
    removeLabelFromNoteOptimistic,
    reorderNotes,
    togglePin,
    updateLabel,
    updateNote: updateNoteById,
  }
}
