import { DraggableAttributes } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Box } from '@mui/system'
import { Label, Note } from '@zunou-graphql/core/graphql'
import React from 'react'

import { NoteItemCard } from './components/NoteItemCard'

interface SortableNoteItemProps {
  id: string
  note: Note
  selected: boolean
  onToggleSelect: (noteId: string) => void
  onTogglePin: (noteId: string) => void
  onDelete: (noteId: string) => void
  onClick: () => void
  onAddLabelToNote: (noteId: string, label: string) => void
  onRemoveLabelFromNote: (noteId: string, label: string) => void
  labelPool: Label[]
  addLabelToPool: (label: string, color?: string) => void
  isGrid?: boolean
  onCreateDataSource: () => void
  isCreatingDataSource: boolean
}

export const SortableNoteItem = ({ id, ...props }: SortableNoteItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const sortableStyle: React.CSSProperties = {
    alignSelf: 'center',
    justifySelf: 'center',
    opacity: isDragging ? 0.5 : 1,
    transform: CSS.Transform.toString(transform),
    transition,
    width: '100%',
    zIndex: isDragging ? 999 : 'auto',
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      ref={setNodeRef}
      style={sortableStyle}
    >
      <NoteItemCard
        {...props}
        dragAttributes={attributes}
        dragListeners={listeners as unknown as DraggableAttributes}
        isDragging={isDragging}
      />
    </Box>
  )
}
