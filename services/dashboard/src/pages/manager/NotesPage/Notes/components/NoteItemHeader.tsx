import { DraggableAttributes } from '@dnd-kit/core'
import { DragIndicator, PushPin, PushPinOutlined } from '@mui/icons-material'
import { Icon, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { Note } from '@zunou-graphql/core/graphql'

import { ZunouAssistant } from './ZunouAssistant'

interface NoteItemHeaderProps {
  note: Note
  hovered: boolean
  onTogglePin: () => void
  dragAttributes?: DraggableAttributes
  dragListeners?: DraggableAttributes
}

export const NoteItemHeader = ({
  note,
  hovered,
  onTogglePin,
  dragAttributes,
  dragListeners,
}: NoteItemHeaderProps) => {
  return (
    <Stack
      alignItems="center"
      borderBottom="1px solid"
      borderColor="divider"
      direction="row"
      justifyContent="space-between"
      p={1}
      width="100%"
    >
      <Typography
        fontWeight="bold"
        noWrap={true}
        sx={{
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {note.title}
      </Typography>
      <Stack
        alignItems="center"
        direction="row"
        visibility={hovered ? 'visible' : 'hidden'}
      >
        <ZunouAssistant title={note.title} />
        <IconButton
          onClick={(e) => {
            e.stopPropagation()
            onTogglePin()
          }}
          size="small"
        >
          <Tooltip placement="bottom" title={note.pinned ? 'Unpin' : 'Pin'}>
            <Icon
              component={note.pinned ? PushPin : PushPinOutlined}
              fontSize="inherit"
            />
          </Tooltip>
        </IconButton>

        <IconButton
          size="small"
          sx={{
            cursor: 'grab',
          }}
          {...dragAttributes}
          {...dragListeners}
        >
          <Tooltip title="Drag to reorder">
            <DragIndicator fontSize="inherit" />
          </Tooltip>
        </IconButton>
      </Stack>
    </Stack>
  )
}
