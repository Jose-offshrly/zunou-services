import { DraggableAttributes } from '@dnd-kit/core'
import { CardContent, Divider, Stack } from '@mui/material'
import { Label, Note } from '@zunou-graphql/core/graphql'
import { Card, CardActions } from '@zunou-react/components/layout'
import { useState } from 'react'

import { NoteItemLabels } from '../../Labels/NoteItemLabels'
import { NoteItemActions } from './NoteItemActions'
import { NoteItemContent } from './NoteItemContent'
import { NoteItemHeader } from './NoteItemHeader'

interface NoteItemCardProps {
  note: Note
  onTogglePin: (noteId: string) => void
  onDelete: (noteId: string) => void
  onClick: () => void
  onAddLabelToNote: (noteId: string, label: string) => void
  onRemoveLabelFromNote: (noteId: string, label: string) => void
  labelPool: Label[]
  addLabelToPool: (label: string, color?: string) => void
  isGrid?: boolean
  isDragging?: boolean
  dragAttributes?: DraggableAttributes
  dragListeners?: DraggableAttributes
  onCreateDataSource: () => void
  isCreatingDataSource: boolean
}

export const NoteItemCard = ({
  note,
  onTogglePin,
  onDelete,
  onClick,
  onAddLabelToNote,
  onRemoveLabelFromNote,
  labelPool,
  addLabelToPool,
  isGrid = true,
  dragAttributes,
  dragListeners,
  onCreateDataSource,
  isCreatingDataSource,
}: NoteItemCardProps) => {
  const [hovered, setHovered] = useState(false)

  const handleTogglePin = () => {
    onTogglePin(note.id)
  }

  const handleDelete = () => {
    onDelete(note.id)
  }

  return (
    <Card
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        cursor: 'pointer',
        flexGrow: 1,
        maxWidth: isGrid ? '100%' : 1120,
        minWidth: isGrid ? '100%' : 560,
        p: 0,
      }}
    >
      <NoteItemHeader
        dragAttributes={dragAttributes}
        dragListeners={dragListeners}
        hovered={hovered}
        note={note}
        onTogglePin={handleTogglePin}
      />
      <CardContent
        sx={{ maxHeight: '360px', minHeight: 160, overflow: 'auto', p: 1 }}
      >
        <NoteItemContent note={note} />
      </CardContent>
      <Stack p={1}>
        <NoteItemLabels
          isCompact={true}
          labelPool={labelPool}
          note={note}
          onRemoveLabel={onRemoveLabelFromNote}
        />
      </Stack>

      <Divider
        sx={{
          visibility: hovered ? 'visible' : 'hidden',
        }}
      />
      <CardActions sx={{ p: 1 }}>
        <NoteItemActions
          addLabelToPool={addLabelToPool}
          hovered={hovered}
          isCreatingDataSource={isCreatingDataSource}
          labelPool={labelPool}
          note={note}
          onAddLabelToNote={onAddLabelToNote}
          onCreateDataSource={onCreateDataSource}
          onDelete={handleDelete}
          onRemoveLabelFromNote={onRemoveLabelFromNote}
        />
      </CardActions>
    </Card>
  )
}
