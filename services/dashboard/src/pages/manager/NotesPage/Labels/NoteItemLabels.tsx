import { alpha, darken, Stack } from '@mui/material'
import { Label, Note } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'

import { ChipButton } from '~/components/ui/button/ChipButton'

interface NoteItemLabelsProps {
  note: Note
  labelPool: Label[]
  isCompact?: boolean
  onRemoveLabel: (noteId: string, label: string) => void
}

export const NoteItemLabels = ({
  note,
  labelPool,
  onRemoveLabel,
  isCompact = false,
}: NoteItemLabelsProps) => {
  const handleRemoveLabel = (label: string) => {
    onRemoveLabel(note.id, label)
  }

  return (
    <Stack direction="row" spacing={1}>
      {note.labels?.slice(0, isCompact ? 2 : undefined).map((noteLabel, i) => {
        const fullLabel = labelPool.find(
          (label) => label.name === noteLabel.name,
        )
        // Use color from noteLabel first (includes labels from other pulses),
        // fall back to labelPool if not available
        const labelColor = noteLabel.color || fullLabel?.color
        return (
          <ChipButton
            key={i}
            label={noteLabel.name}
            onDelete={() => handleRemoveLabel(noteLabel.name)}
            size="small"
            sx={{
              '& .MuiChip-deleteIcon': {
                opacity: 0,
                transition: 'opacity 0.2s',
              },
              '&:hover .MuiChip-deleteIcon': {
                color: alpha(theme.palette.primary.main, 0.75),
                opacity: 1,
              },
              background:
                labelColor && labelColor !== 'transparent'
                  ? labelColor
                  : 'transparent',
              border: '1px solid',
              borderColor:
                labelColor && labelColor !== 'transparent'
                  ? darken(labelColor, 0.1)
                  : undefined,
              color:
                labelColor === '#4A00E0BF'
                  ? 'white'
                  : theme.palette.text.primary,
            }}
            variant="outlined"
          />
        )
      })}
      {isCompact && note.labels && note.labels.length > 2 && (
        <ChipButton
          label={`+${note.labels.length - 2}`}
          size="small"
          sx={{
            borderColor: theme.palette.text.primary,
          }}
          variant="outlined"
        />
      )}
    </Stack>
  )
}
