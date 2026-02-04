import { Stack, Typography } from '@mui/material'
import { Note } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'

import { formatDateAndTime } from '~/utils/formatDateAndTime'

interface NoteFooterProps {
  note?: Note
}

export const NoteFooter = ({ note }: NoteFooterProps) => {
  if (!note?.id) {
    return null
  }

  return (
    <Stack
      alignItems="flex-end"
      direction="row"
      justifyContent="flex-end"
      px={2}
      py={1}
    >
      <Typography color={theme.palette.text.secondary} variant="body2">
        {note?.updatedAt
          ? `Last edited on ${formatDateAndTime(note.updatedAt)}`
          : 'Last edited recently'}
      </Typography>
    </Stack>
  )
}
