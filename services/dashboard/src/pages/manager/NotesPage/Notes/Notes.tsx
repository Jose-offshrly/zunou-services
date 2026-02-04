import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { Box, Grid, Stack, Typography } from '@mui/material'
import { Label, Note } from '@zunou-graphql/core/graphql'
import { useGetNoteQuery } from '@zunou-queries/core/hooks/useGetNoteQuery'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { DeleteNoteModal } from '../components/DeleteNoteModal'
import { NoteModal } from '../components/NoteModal'
import { SortableNoteItem } from './SortableNoteItem'

// Custom hook to read DataSourceSidebar collapsed state
const useDataSourceSidebarState = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    const checkSidebarState = () => {
      const sidebarState = localStorage.getItem('datasource-sidebar-view-state')
      setIsSidebarCollapsed(sidebarState === 'false')
    }

    // Check initial state
    checkSidebarState()

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'datasource-sidebar-view-state') {
        checkSidebarState()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also listen for custom events if the sidebar updates localStorage
    const handleCustomStorageChange = () => {
      checkSidebarState()
    }

    window.addEventListener('localStorageChange', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener(
        'localStorageChange',
        handleCustomStorageChange,
      )
    }
  }, [])

  return isSidebarCollapsed
}

interface NotesProps {
  notes: Note[]
  allNotes: Note[]
  selectedNotes?: string[]
  onToggleSelect?: (noteId: string) => void
  onTogglePin: (noteId: string) => void
  onDelete: (noteId: string) => void
  onAddLabelToNote: (noteId: string, label: string) => void
  onRemoveLabelFromNote: (noteId: string, label: string) => void
  labelPool: Label[]
  addLabelToPool: (label: string, color?: string) => void
  isGrid?: boolean
  createDataSourceFromNote: (
    noteId: string,
    noteTitle: string,
    noteContent?: string,
  ) => Promise<void>
  isCreatingDataSource: boolean
}

export const Notes = ({
  notes,
  selectedNotes,
  onToggleSelect,
  onTogglePin,
  onDelete,
  onAddLabelToNote,
  onRemoveLabelFromNote,
  labelPool,
  addLabelToPool,
  isGrid = true,
  createDataSourceFromNote,
  isCreatingDataSource,
}: NotesProps) => {
  const [searchParams] = useSearchParams()

  const pinnedNotes = notes.filter((note) => note.pinned)
  const unpinnedNotes = notes.filter((note) => !note.pinned)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)

  // Get DataSourceSidebar collapsed state
  const isSidebarCollapsed = useDataSourceSidebarState()

  const selectedNoteId = searchParams.get('id')

  // Fetch the specific note if it's not in the current page
  const { data: fetchedNoteData } = useGetNoteQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled:
      !!selectedNoteId && !notes.find((note) => note.id === selectedNoteId),
    variables: { noteId: selectedNoteId || '' },
  })

  const handleCreateDataSource = async (note: Note) => {
    if (isCreatingDataSource) {
      return
    }

    const hasContent = note.title && note.content

    if (!hasContent) {
      console.error('No file or content available to create data source')
      return
    }

    try {
      await createDataSourceFromNote(note.id, note.title, note.content || '')
    } catch (error) {
      console.error('Error creating data source from note:', error)
    }
  }

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedNote(null)
  }

  const handleDeleteClick = (note: Note) => {
    setNoteToDelete(note)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (noteToDelete) {
      onDelete(noteToDelete.id)
      setNoteToDelete(null)
    }
  }

  const handleDeleteModalClose = () => {
    setDeleteModalOpen(false)
    setNoteToDelete(null)
  }

  const renderNoteItem = (note: Note) => {
    const commonProps = {
      addLabelToPool,
      id: note.id,
      isCreatingDataSource,
      isGrid,
      labelPool,
      note,
      onAddLabelToNote,
      onClick: () => handleNoteClick(note),
      onCreateDataSource: () => handleCreateDataSource(note),
      onDelete: () => handleDeleteClick(note),
      onRemoveLabelFromNote,
      onTogglePin,
      onToggleSelect: onToggleSelect || (() => undefined),
      selected: selectedNotes?.includes(note.id) || false,
    }

    return isGrid ? (
      <Grid
        item={true}
        key={note.id}
        lg={isSidebarCollapsed ? 3 : 4}
        md={6}
        sm={12}
        xl={isSidebarCollapsed ? 3 : 4}
        xs={12}
      >
        <SortableNoteItem {...commonProps} />
      </Grid>
    ) : (
      <SortableNoteItem key={note.id} {...commonProps} />
    )
  }

  const renderNotes = (notesList: Note[], sectionTitle: string) => {
    if (notesList.length === 0) return null

    return (
      <>
        <Typography
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 'bold',
            mb: 1,
          }}
        >
          {sectionTitle}
        </Typography>
        <SortableContext
          items={notesList.map((note) => note.id)}
          strategy={rectSortingStrategy}
        >
          {isGrid ? (
            <Box sx={{ flexGrow: 1 }}>
              <Grid container={true} spacing={1}>
                {notesList.map(renderNoteItem)}
              </Grid>
            </Box>
          ) : (
            <Stack alignItems="center" justifyContent="center" spacing={2}>
              {notesList.map(renderNoteItem)}
            </Stack>
          )}
        </SortableContext>
      </>
    )
  }

  // Effect to open the modal when a note was selected from the pulse chat
  useEffect(() => {
    if (selectedNoteId) {
      const localNote = notes.find((note) => note.id === selectedNoteId)

      // use local note if it's found in the current page of notes
      if (localNote) {
        setSelectedNote(localNote)
        setModalOpen(true)
      } else if (fetchedNoteData?.note) {
        // If not found locally use fetched note
        setSelectedNote(fetchedNoteData.note)
        setModalOpen(true)
      }
    }
  }, [searchParams])

  return (
    <>
      <Stack spacing={1}>
        {renderNotes(pinnedNotes, 'PINNED')}
        {renderNotes(unpinnedNotes, pinnedNotes.length > 0 ? 'OTHERS' : '')}
      </Stack>

      {modalOpen && (
        <NoteModal
          addLabelToPool={addLabelToPool}
          createDataSourceFromNote={createDataSourceFromNote}
          isCreatingDataSource={isCreatingDataSource}
          labels={labelPool}
          note={selectedNote}
          noteId={selectedNote?.id}
          onAddLabelToNote={onAddLabelToNote}
          onClose={handleModalClose}
          onRemoveLabelFromNote={onRemoveLabelFromNote}
          open={modalOpen}
        />
      )}

      <DeleteNoteModal
        handleClose={handleDeleteModalClose}
        isOpen={deleteModalOpen}
        note={noteToDelete}
        onConfirmDelete={handleDeleteConfirm}
      />
    </>
  )
}
