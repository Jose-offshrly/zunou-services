import { CloseOutlined, PushPin, PushPinOutlined } from '@mui/icons-material'
import { Icon, IconButton, InputBase, Stack, Typography } from '@mui/material'
import { Note } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'
import { FieldErrors } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

interface NoteCardHeaderProps {
  note?: Note
  editMode?: boolean
  errors?: FieldErrors<Record<string, unknown>>
  onTitleChange: (val: string) => void
  onTitleKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void
  onTogglePin?: () => void
  onClose?: () => void
  hideClose?: boolean
}

export const NoteCardHeader = ({
  note,
  editMode = false,
  errors,
  onTitleChange,
  onTitleKeyDown,
  onTogglePin,
  onClose,
  hideClose = false,
}: NoteCardHeaderProps) => {
  const { t } = useTranslation('common')

  return (
    <Stack direction="row" justifyContent="space-between" spacing={0.5}>
      {editMode ? (
        <Stack width="100%">
          <InputBase
            inputProps={{ maxLength: 100 }}
            onChange={(e) => onTitleChange(e.target.value)}
            onKeyDown={onTitleKeyDown}
            placeholder={t('title')}
            sx={{
              borderBottom: errors?.title
                ? `1px solid ${theme.palette.error.main}`
                : 'none',
              fontWeight: 'bold',
            }}
            value={note?.title || ''}
          />
          {errors?.title && (
            <Typography color="error" fontSize="0.75rem" sx={{ mt: 0.5 }}>
              {errors.title.message!}
            </Typography>
          )}
        </Stack>
      ) : (
        <Typography color="text.primary" fontWeight="bold">
          {note?.title}
        </Typography>
      )}

      <Stack alignItems="center" direction="row">
        <IconButton
          color="primary"
          onClick={(e) => {
            e.stopPropagation()
            onTogglePin?.()
          }}
        >
          <Icon
            component={note?.pinned ? PushPin : PushPinOutlined}
            fontSize="small"
            sx={{ color: theme.palette.primary.main }}
          />
        </IconButton>
        {!hideClose && (
          <IconButton onClick={onClose}>
            <CloseOutlined fontSize="small" />
          </IconButton>
        )}
      </Stack>
    </Stack>
  )
}
