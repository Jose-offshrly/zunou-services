import {
  AddLink,
  AttachFile,
  ContentPasteOutlined,
  DeleteOutline,
  FormatStrikethrough,
} from '@mui/icons-material'
import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined'
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined'
import { alpha, Box, Divider, IconButton, Stack, Tooltip } from '@mui/material'
import { Note } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form/Button'
import { theme } from '@zunou-react/services/Theme'
import { useRef } from 'react'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { getDataSourceTooltipMessage } from '../../utils/labelUtils'

interface NoteToolbarProps {
  note?: Note
  editMode?: boolean
  isValid?: boolean
  isUploading?: boolean
  canCreateDataSource?: boolean
  hasAccess?: boolean
  hasContent?: boolean
  hasExistingDataSource?: boolean
  isCreatingDataSource?: boolean
  onFormat: (format: string, value?: unknown) => void
  onAddLink: () => void
  onLabelButtonClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  onFileButtonClick: () => void
  onDelete?: () => void
  onSave: () => void
  createDataSourceFromNote?: (
    noteId: string,
    noteTitle: string,
    noteContent?: string,
  ) => Promise<void>
  hideSend?: boolean
  hideDelete?: boolean
  hideAttachment?: boolean
}

export const NoteToolbar = ({
  note,
  editMode = false,
  isValid = true,
  isUploading = false,
  canCreateDataSource = true,
  hasAccess = false,
  hasExistingDataSource = false,
  isCreatingDataSource = false,
  onFormat,
  onAddLink,
  onLabelButtonClick,
  onFileButtonClick,
  onDelete,
  onSave,
  createDataSourceFromNote,
  hideSend = false,
  hideDelete = false,
  hideAttachment = false,
}: NoteToolbarProps) => {
  const { t } = useTranslation(['common', 'notes'])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const iconButtonSx = {
    '&:hover': {
      backgroundColor: 'transparent',
      color: theme.palette.primary.main,
    },
    color: theme.palette.text.primary,
    p: 0.5,
  }

  const isContentEmpty = (content?: string | null): boolean => {
    if (!content) return true
    let cleaned = content.trim()
    cleaned = cleaned.replace(
      /(<p>(\s|&nbsp;)*<\/p>|<p><br><\/p>|<p>\s*<br>\s*<\/p>)*$/g,
      '',
    )
    cleaned = cleaned.replace(/\s+/g, ' ')
    return cleaned.length === 0
  }

  const hasActualContent =
    note?.title && note?.content && !isContentEmpty(note.content)

  const isDisabled =
    !hasAccess ||
    !hasActualContent ||
    hasExistingDataSource ||
    isCreatingDataSource

  const handleAddDataSource = async () => {
    const hasContent =
      note?.title && note?.content && !isContentEmpty(note.content)

    if (!hasContent) {
      toast.error(t('no_content_to_create_data_source', { ns: 'notes' }))
      return
    }

    try {
      await createDataSourceFromNote?.(
        note.id || '',
        note.title || '',
        note?.content || '',
      )
    } catch (error) {
      toast.error(t('create_data_source_error', { ns: 'notes' }))
    }
  }

  return (
    <>
      <Stack
        alignItems="center"
        direction="row"
        p={1}
        spacing={1}
        sx={{
          backgroundColor: 'white',
          borderTop: `1px solid ${theme.palette.divider}`,
          minHeight: 40,
        }}
      >
        <Tooltip title={t('bold', { ns: 'notes' })}>
          <IconButton onClick={() => onFormat('bold')} sx={iconButtonSx}>
            <FormatBoldIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('italic', { ns: 'notes' })}>
          <IconButton onClick={() => onFormat('italic')} sx={iconButtonSx}>
            <FormatItalicIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('underline', { ns: 'notes' })}>
          <IconButton onClick={() => onFormat('underline')} sx={iconButtonSx}>
            <FormatUnderlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('strikethrough', { ns: 'notes' })}>
          <IconButton onClick={() => onFormat('strike')} sx={iconButtonSx}>
            <FormatStrikethrough fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider
          flexItem={true}
          orientation="vertical"
          sx={{ borderColor: theme.palette.divider, mx: 0.5 }}
        />

        <Tooltip title={t('bulleted_list', { ns: 'notes' })}>
          <IconButton
            onClick={() => onFormat('list', 'bullet')}
            sx={iconButtonSx}
          >
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={t('add_link', { ns: 'notes' })}>
          <IconButton onClick={onAddLink} sx={iconButtonSx}>
            <AddLink fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider
          flexItem={true}
          orientation="vertical"
          sx={{ borderColor: theme.palette.divider, mx: 0.5 }}
        />

        <Tooltip title={t('add_label', { ns: 'notes' })}>
          <IconButton onClick={onLabelButtonClick} sx={iconButtonSx}>
            <LabelOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {canCreateDataSource && (
          <Tooltip
            title={t(
              getDataSourceTooltipMessage(
                !!hasAccess,
                !!hasActualContent,
                !!hasExistingDataSource,
                !!isCreatingDataSource,
              ),
              { ns: 'notes' },
            )}
          >
            <span>
              <IconButton
                disabled={isDisabled}
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddDataSource()
                }}
                sx={{
                  ...iconButtonSx,
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: isDisabled
                      ? alpha(theme.palette.text.disabled, 0.6)
                      : theme.palette.primary.main,
                  },
                  color: isDisabled
                    ? alpha(theme.palette.text.disabled, 0.6)
                    : theme.palette.text.primary,
                }}
              >
                <ContentPasteOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}

        {!hideAttachment && (
          <Tooltip title={t('upload_file_image', { ns: 'notes' })}>
            <IconButton onClick={onFileButtonClick} sx={iconButtonSx}>
              <AttachFile fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Divider
          flexItem={true}
          orientation="vertical"
          sx={{ borderColor: theme.palette.divider, mx: 0.5 }}
        />

        {!hideDelete && onDelete && editMode && (
          <Tooltip title={t('delete', { ns: 'notes' })}>
            <IconButton onClick={onDelete} sx={iconButtonSx}>
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Box flexGrow={1} />

        {!hideSend && (
          <Button
            disabled={!isValid || isUploading}
            onClick={onSave}
            variant="contained"
          >
            {isUploading ? t('uploading') : t('save')}
          </Button>
        )}
      </Stack>

      <input
        accept="*/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        type="file"
      />
    </>
  )
}
