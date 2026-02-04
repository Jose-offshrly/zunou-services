import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { zodResolver } from '@hookform/resolvers/zod'
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined'
import {
  alpha,
  Box,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { Note, NoteAttachmentInput } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form/Button'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useMemo, useState } from 'react'
import { FieldErrors, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { InView } from 'react-intersection-observer'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { NoteFormData, noteSchema } from '~/schemas/NoteSchema'
import {
  CreateNoteInputWithAttachment,
  usePulseStore,
} from '~/store/usePulseStore'

import { MultiFilter } from './components/MultiFilter'
import { useNotes } from './hooks'
import { LabelModal } from './Labels/LabelModal'
import { NoteCard } from './NoteCard/NoteCard'
import { NotesTopBar } from './Notes/components/NotesTopBar'
import { Notes } from './Notes/Notes'

export interface NoteAttachmentInputWithTempUrl extends NoteAttachmentInput {
  tempUrl: string
}

const NOTE_DEFAULT = { description: '', isPinned: false, labels: [], title: '' }

const NotesPage = () => {
  const { t } = useTranslation('notes')

  const [isGrid, setIsGrid] = useState(() => {
    const savedViewType = localStorage.getItem('notes-view-type')
    return savedViewType ? savedViewType === 'grid' : true
  })

  useEffect(() => {
    localStorage.setItem('notes-view-type', isGrid ? 'grid' : 'list')
  }, [isGrid])

  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])

  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false)
  const handleOpenManageLabels = () => setIsLabelModalOpen(true)

  const { pulseId } = useParams<{ pulseId: string }>()
  const { pulseActions, addActionToPulse } = usePulseStore()

  const pulseAction = useMemo(
    () => pulseActions.find((pulse) => pulse.id === pulseId),
    [pulseActions, pulseId],
  )

  const {
    notes,
    isLoading,
    addNote,
    deleteNote,
    togglePin,
    reorderNotes,
    labels: labelPoolRaw,
    manageLabels,
    isPersonalPulse,
    createLabel,
    updateLabel,
    deleteLabel,
    createDataSourceFromNote,
    isCreatingDataSource,
    handleRemoveExistingFile,
    addLabelToNoteOptimistic,
    removeLabelFromNoteOptimistic,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useNotes()

  const labelPool =
    isPersonalPulse && labelPoolRaw && labelPoolRaw.length > 0
      ? labelPoolRaw
      : manageLabels || []

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const initialNoteWithAttachment = useMemo(
    () => pulseAction?.createNoteInput ?? null,
    [pulseAction],
  )

  useEffect(() => {
    if (initialNoteWithAttachment)
      setIsCreateNoteFormOpen(initialNoteWithAttachment.isCreateOpen)
  }, [initialNoteWithAttachment])

  const initialNote = useMemo(
    () =>
      initialNoteWithAttachment
        ? {
            description: initialNoteWithAttachment.description,
            isPinned: initialNoteWithAttachment.isPinned,
            labels: initialNoteWithAttachment.labels,
            title: initialNoteWithAttachment.title,
          }
        : NOTE_DEFAULT,
    [initialNoteWithAttachment],
  )

  const initialAttachments = useMemo(
    () =>
      initialNoteWithAttachment && initialNoteWithAttachment.fileAttachments
        ? initialNoteWithAttachment.fileAttachments
        : [],
    [initialNoteWithAttachment],
  )

  const initialCreateNoteFormOpen = useMemo(
    () => initialNoteWithAttachment?.isCreateOpen,
    [initialNoteWithAttachment],
  )

  const [isCreateNoteFormOpen, setIsCreateNoteFormOpen] = useState(
    initialCreateNoteFormOpen,
  )

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<NoteFormData>({
    defaultValues: initialNote,
    mode: 'onChange',
    resolver: zodResolver(noteSchema),
  })

  const [fileAttachments, setFileAttachments] =
    useState<NoteAttachmentInputWithTempUrl[]>(initialAttachments)

  const {
    title,
    description,
    labels: formLabels,
    isPinned,
  } = useWatch({ control })

  useEffect(() => {
    if (!pulseId || !isCreateNoteFormOpen) return

    // Only save if there's actual content (not just empty values)
    const hasContent =
      title?.trim() ||
      description?.trim() ||
      (formLabels && formLabels.length > 0) ||
      isPinned ||
      (fileAttachments && fileAttachments.length > 0)

    if (hasContent) {
      const note: CreateNoteInputWithAttachment = {
        description: description || '',
        fileAttachments: fileAttachments || [],
        isCreateOpen: isCreateNoteFormOpen,
        isPinned: isPinned || false,
        labels: formLabels || [],
        title: title || '',
      }

      addActionToPulse({ id: pulseId, updates: { createNoteInput: note } })
    }
  }, [
    title,
    description,
    formLabels,
    isPinned,
    fileAttachments,
    addActionToPulse,
    pulseId,
    isCreateNoteFormOpen,
  ])

  const filteredNotes = useMemo(() => {
    let filtered = notes

    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(searchTerm) ||
          (note.content?.toLowerCase() || '').includes(searchTerm),
      )
    }

    if (selectedLabels.length > 0) {
      filtered = filtered.filter(
        (note) =>
          note.labels?.some(() => true) &&
          selectedLabels.every((selectedLabel) =>
            note.labels?.some((noteLabel) => noteLabel.name === selectedLabel),
          ),
      )
    }

    return filtered
  }, [notes, searchQuery, selectedLabels])

  // auto-fetch more pages when searching and results are limited
  useEffect(() => {
    const MIN_SEARCH_RESULTS = 5

    if (
      searchQuery.trim() &&
      filteredNotes.length < MIN_SEARCH_RESULTS &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isLoading
    ) {
      fetchNextPage()
    }
  }, [
    searchQuery,
    filteredNotes.length,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    fetchNextPage,
  ])

  const handleDragStart = (event: DragStartEvent) => {
    const noteId = event.active.id as string
    const draggedNote = filteredNotes.find((note) => note.id === noteId)
    if (draggedNote) {
      setActiveNote(draggedNote)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) {
      setActiveNote(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId !== overId) {
      const activeNote = notes.find((note) => note.id === activeId)
      const overNote = notes.find((note) => note.id === overId)

      if (!activeNote || !overNote || activeNote.pinned !== overNote.pinned) {
        setActiveNote(null)
        return
      }

      const sectionNotes = notes.filter(
        (note) => note.pinned === activeNote.pinned,
      )
      const oldIndex = sectionNotes.findIndex((note) => note.id === activeId)
      const newIndex = sectionNotes.findIndex((note) => note.id === overId)

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedNotes = arrayMove(sectionNotes, oldIndex, newIndex)
        const noteOrderInputs = reorderedNotes.map((note, index) => ({
          id: note.id,
          position: index,
        }))
        reorderNotes(noteOrderInputs)
      }
    }

    setActiveNote(null)
  }

  const handleSaveNote = handleSubmit((data: NoteFormData) => {
    if (!pulseId) return

    if (data.title.trim()) {
      addNote(data, fileAttachments)

      addActionToPulse({
        id: pulseId,
        updates: {
          createNoteInput: {
            description: '',
            fileAttachments: [],
            isCreateOpen: false,
            isPinned: false,
            labels: [],
            title: '',
          },
        },
      })

      // Small delay to ensure store update completes before form reset
      setTimeout(() => {
        reset(NOTE_DEFAULT)
        setFileAttachments([])
        setIsCreateNoteFormOpen(false)
      }, 0)
    }
  })

  const handleCloseNoteCard = () => {
    if (pulseId)
      addActionToPulse({
        id: pulseId,
        updates: {
          createNoteInput: {
            description: '',
            fileAttachments: [],
            isCreateOpen: false,
            isPinned: false,
            labels: [],
            title: '',
          },
        },
      })

    // Small delay to ensure store update completes before form reset
    setTimeout(() => {
      reset(NOTE_DEFAULT)
      setFileAttachments([])
      setIsCreateNoteFormOpen(false)
    }, 0)
  }

  const handleFileChange = (attachments: NoteAttachmentInputWithTempUrl[]) => {
    setFileAttachments(attachments)
  }

  const handleAddLabel = (label: string) => {
    const currentLabels = formLabels || []
    if (!currentLabels.includes(label)) {
      setValue('labels', [...currentLabels, label], { shouldValidate: true })
    }
  }

  const handleRemoveLabel = (label: string) => {
    const currentLabels = formLabels || []
    setValue(
      'labels',
      currentLabels.filter((l) => l !== label),
      { shouldValidate: true },
    )
  }

  const handleTogglePin = () => {
    setValue('isPinned', !isPinned, { shouldValidate: true })
  }

  const handleToggleSelect = (noteId: string) => {
    setSelectedNotes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(noteId)) {
        newSet.delete(noteId)
      } else {
        newSet.add(noteId)
      }
      return newSet
    })
  }

  const handleTogglePinNote = (noteId: string) => {
    togglePin(noteId)
  }

  const handleDelete = (noteId: string) => {
    deleteNote(noteId)
    setSelectedNotes((prev) => {
      const newSet = new Set(prev)
      newSet.delete(noteId)
      return newSet
    })
  }

  const handleAddLabelToNote = (noteId: string, labelName: string) => {
    addLabelToNoteOptimistic(noteId, labelName)
  }

  const handleRemoveLabelFromNote = (noteId: string, labelName: string) => {
    removeLabelFromNoteOptimistic(noteId, labelName)
  }

  const handleInViewChange = (inView: boolean) => {
    if (!inView || isFetchingNextPage || !hasNextPage) return
    fetchNextPage()
  }

  // Build a comprehensive list of all labels with pulse information
  // This includes labels from labelPool and any additional labels from notes
  const labelsWithPulse = useMemo(() => {
    const labelMap = new Map<string, { name: string; pulseId: string | null }>()

    labelPool.forEach((label) => {
      labelMap.set(label.name, {
        name: label.name,
        pulseId: null,
      })
    })

    notes.forEach((note) => {
      note.labels?.forEach((noteLabel) => {
        const existing = labelMap.get(noteLabel.name)
        const pulseId = noteLabel.pulse?.id || null

        if (existing) {
          if (!existing.pulseId || pulseId) {
            existing.pulseId = pulseId
          }
        } else {
          labelMap.set(noteLabel.name, {
            name: noteLabel.name,
            pulseId,
          })
        }
      })
    })

    return Array.from(labelMap.values())
  }, [labelPool, notes])

  const labelCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    labelPool.forEach((label) => {
      counts[label.name] = notes.filter((note) =>
        note.labels?.some((noteLabel) => noteLabel.name === label.name),
      ).length
    })
    return counts
  }, [labelPool, notes])

  const labelColors = useMemo(() => {
    const colors: Record<string, string> = {}
    labelPool.forEach((label) => {
      colors[label.name] = label.color || 'transparent'
    })
    return colors
  }, [labelPool])

  if (isLoading && notes.length === 0) {
    return (
      <Stack
        alignItems="center"
        height="100%"
        justifyContent="center"
        width="100%"
      >
        <LoadingSpinner />
      </Stack>
    )
  }

  const handleRemoveExistingFileFromNote = (fileId: string) => {
    if (activeNote && fileId) {
      handleRemoveExistingFile(fileId)
    }
  }

  return (
    <>
      <DndContext
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <Stack flex={1} minHeight={0} px={9} py={5} spacing={2}>
          <NotesTopBar
            isGrid={isGrid}
            onManageLabelClick={handleOpenManageLabels}
            onSearch={setSearchQuery}
            onToggleGrid={() => setIsGrid((g) => !g)}
            searchQuery={searchQuery}
          />
          <MultiFilter
            allCount={notes.length}
            labelColors={labelColors}
            labelCounts={labelCounts}
            labels={labelsWithPulse}
            onChange={setSelectedLabels}
            onReset={() => setSelectedLabels([])}
            selected={selectedLabels}
          />
          <Stack alignItems="center">
            {/* Create note form */}
            {!isCreateNoteFormOpen ? (
              <Button
                fullWidth={true}
                onClick={() => {
                  setIsCreateNoteFormOpen(true)
                  if (pulseId)
                    addActionToPulse({
                      id: pulseId,
                      updates: {
                        createNoteInput: {
                          isCreateOpen: true,
                        },
                      },
                    })
                }}
                size="large"
                sx={{
                  '&:hover': {
                    bgcolor: 'common.white',
                  },
                  bgcolor: 'common.white',
                  color: 'primary.main',
                  justifyContent: 'flex-start',
                  maxWidth: 560,
                  px: 1.5,
                  py: 1,
                }}
                variant="outlined"
              >
                {t('take_a_note')}
              </Button>
            ) : (
              <Stack width={560}>
                <NoteCard
                  addLabelToPool={createLabel}
                  canCreateDataSource={false}
                  editMode={true}
                  errors={errors as FieldErrors<Record<string, unknown>>}
                  isValid={isValid}
                  labelPool={manageLabels}
                  note={{
                    content: description || '',
                    id: '',
                    labels: (formLabels || []).map((labelName) => ({
                      color: undefined,
                      id: '',
                      name: labelName,
                    })),
                    pinned: isPinned || false,
                    position: '0',
                    title: title || '',
                    updatedAt: new Date().toISOString(),
                  }}
                  onAddLabel={handleAddLabel}
                  onClose={handleCloseNoteCard}
                  onContentChange={(value) =>
                    setValue('description', value, { shouldValidate: true })
                  }
                  onFileChange={handleFileChange}
                  onRemoveExistingFile={handleRemoveExistingFileFromNote}
                  onRemoveLabel={handleRemoveLabel}
                  onSave={handleSaveNote}
                  onTitleChange={(value) =>
                    setValue('title', value, { shouldValidate: true })
                  }
                  onTogglePin={handleTogglePin}
                  tempAttachment={fileAttachments[0] || undefined}
                />
              </Stack>
            )}
          </Stack>
          <Divider
            sx={{
              borderColor: 'divider',
              my: 2,
            }}
          />
          <Stack flex={1} minHeight={0} overflow="auto">
            {filteredNotes.length === 0 && !isLoading ? (
              <Stack
                alignItems="center"
                height="100%"
                justifyContent="center"
                overflow="auto"
                spacing={2}
              >
                <Stack
                  alignItems="center"
                  bgcolor={alpha(theme.palette.primary.main, 0.1)}
                  borderRadius="50%"
                  display="flex"
                  height={80}
                  justifyContent="center"
                  width={80}
                >
                  <NotesOutlinedIcon
                    sx={{
                      color: 'primary.main',
                      fontSize: 32,
                    }}
                  />
                </Stack>
                <Typography variant="h6">
                  {searchQuery.trim()
                    ? t('no_results_found')
                    : t('notes_placeholder')}
                </Typography>
              </Stack>
            ) : (
              <>
                <Notes
                  addLabelToPool={createLabel}
                  allNotes={notes}
                  createDataSourceFromNote={createDataSourceFromNote}
                  isCreatingDataSource={isCreatingDataSource}
                  isGrid={isGrid}
                  labelPool={manageLabels}
                  notes={filteredNotes}
                  onAddLabelToNote={handleAddLabelToNote}
                  onDelete={handleDelete}
                  onRemoveLabelFromNote={handleRemoveLabelFromNote}
                  onTogglePin={handleTogglePinNote}
                  onToggleSelect={handleToggleSelect}
                  selectedNotes={Array.from(selectedNotes)}
                />
                {hasNextPage && (
                  <InView
                    onChange={handleInViewChange}
                    skip={!!isFetchingNextPage}
                    threshold={0.1}
                    triggerOnce={false}
                  >
                    {({ ref }) => (
                      <div
                        ref={ref}
                        style={{
                          alignItems: 'center',
                          display: 'flex',
                          flexShrink: 0,
                          justifyContent: 'center',
                          minHeight: 32,
                        }}
                      >
                        {isFetchingNextPage && <CircularProgress size={20} />}
                      </div>
                    )}
                  </InView>
                )}
              </>
            )}
          </Stack>
        </Stack>

        <DragOverlay
          dropAnimation={{
            duration: 300,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
          zIndex={1200}
        >
          {activeNote && (
            <Box
              display="flex"
              justifyContent="center"
              sx={{
                opacity: 0.8,
                overflow: 'hidden',
                transform: 'rotate(5deg)',
              }}
            >
              <Stack
                alignItems="flex-start"
                bgcolor="white"
                border={`1px solid ${alpha(theme.palette.primary.main, 0.3)}`}
                borderRadius={2}
                height={300}
                justifyContent="flex-start"
                maxWidth={isGrid ? 320 : 560}
                mb={2}
                minWidth={isGrid ? 320 : 560}
                overflow="hidden"
                p={3}
              >
                <Typography
                  color={theme.palette.text.primary}
                  fontSize="18px"
                  fontWeight={600}
                >
                  {activeNote.title}
                </Typography>
                <Stack
                  component="div"
                  dangerouslySetInnerHTML={{ __html: activeNote.content || '' }}
                  sx={{
                    color: 'text.primary',
                    fontSize: 14,
                    wordBreak: 'break-word',
                  }}
                />
              </Stack>
            </Box>
          )}
        </DragOverlay>
      </DndContext>

      <LabelModal
        labels={manageLabels}
        onClose={() => setIsLabelModalOpen(false)}
        onCreate={createLabel}
        onDelete={deleteLabel}
        onUpdate={updateLabel}
        open={isLabelModalOpen}
      />
    </>
  )
}

export default NotesPage
