import {
  Add,
  FormatBoldOutlined,
  FormatIndentDecreaseOutlined,
  FormatIndentIncreaseOutlined,
  FormatItalicOutlined,
  FormatListBulletedOutlined,
  FormatListNumberedOutlined,
  FormatUnderlinedOutlined,
  ImageOutlined,
  InsertDriveFileOutlined,
  StrikethroughSOutlined,
} from '@mui/icons-material'
import {
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useRef, useState } from 'react'
import { Editor, Element } from 'slate'

import { CustomEditor } from './custom-types'
import {
  indentList,
  outdentList,
  toggleBoldMark,
  toggleBulletedList,
  toggleItalicMark,
  toggleNumberedList,
  toggleStrikethroughMark,
  toggleUnderlineMark,
} from './editor/utils'

const iconButtonStyle = {
  borderRadius: '4px',
  cursor: 'pointer',
  padding: '4px',
  transition: 'background-color 0.2s ease',
}

const iconButtonHoverStyle = {
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
}

interface SlateToolbarProps {
  editor: CustomEditor
  showAddMenu?: boolean
  disableAddMenu?: boolean
  disableAddMenuTooltip?: string
  onFileUpload?: (files: File[]) => void
  onImageUpload?: (files: File[]) => void
}

const isListActive = (editor: CustomEditor, format: string): boolean => {
  const { selection } = editor
  if (!selection) return false

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) && Element.isElement(n) && n.type === format,
    }),
  )

  return !!match
}

export const SlateToolbar = ({
  editor,
  showAddMenu = false,
  disableAddMenu = false,
  disableAddMenuTooltip,
  onFileUpload,
  onImageUpload,
}: SlateToolbarProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const open = Boolean(anchorEl)

  const isBulletedListActive = isListActive(editor, 'bulleted-list')
  const isNumberedListActive = isListActive(editor, 'numbered-list')

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleFileUploadClick = () => {
    fileInputRef.current?.click()
    handleClose()
  }

  const handleImageUploadClick = () => {
    imageInputRef.current?.click()
    handleClose()
  }

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0 && onFileUpload) {
      onFileUpload(Array.from(files))
    }
    // Reset input value to allow selecting the same files again
    event.target.value = ''
  }

  const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0 && onImageUpload) {
      onImageUpload(Array.from(files))
    }
    // Reset input value to allow selecting the same files again
    event.target.value = ''
  }

  return (
    <Stack alignItems="center" direction="row" spacing={1}>
      {showAddMenu && (
        <>
          <Tooltip
            arrow={true}
            placement="top"
            title={disableAddMenu ? disableAddMenuTooltip : ''}
          >
            <Stack
              justifyContent="center"
              onClick={disableAddMenu ? undefined : handleClick}
              sx={{
                ...iconButtonStyle,
                ...(disableAddMenu ? {} : iconButtonHoverStyle),
                cursor: disableAddMenu ? 'not-allowed' : 'pointer',
                opacity: disableAddMenu ? 0.4 : 1,
              }}
            >
              <Add fontSize="small" />
            </Stack>
          </Tooltip>
          <input
            accept=".csv,.doc,.docx,.html,.md,.pdf,.ppt,.pptx,.txt,.xls,.xlsx,.rtf,.mp4,.jpg,.jpeg,.png,.gif,.webp"
            multiple={true}
            onChange={onFileChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
            type="file"
          />
          <input
            accept="image/*"
            multiple={true}
            onChange={onImageChange}
            ref={imageInputRef}
            style={{ display: 'none' }}
            type="file"
          />

          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
              horizontal: 'left',
              vertical: 'top',
            }}
            onClose={handleClose}
            open={open}
            transformOrigin={{
              horizontal: 'left',
              vertical: 'bottom',
            }}
          >
            <MenuItem onClick={handleImageUploadClick}>
              <ListItemIcon>
                <ImageOutlined fontSize="small" />
              </ListItemIcon>
              <Typography fontSize="medium">Image</Typography>
            </MenuItem>

            <MenuItem onClick={handleFileUploadClick}>
              <ListItemIcon>
                <InsertDriveFileOutlined fontSize="small" />
              </ListItemIcon>
              <Typography fontSize="medium">File</Typography>
            </MenuItem>
          </Menu>
        </>
      )}

      {/* Bold */}
      <Tooltip arrow={true} placement="top" title="Bold (Ctrl+B)">
        <Stack
          justifyContent="center"
          onMouseDown={(event) => {
            event.preventDefault()
            toggleBoldMark(editor)
          }}
          sx={{
            ...iconButtonStyle,
            ...iconButtonHoverStyle,
          }}
        >
          <FormatBoldOutlined fontSize="small" />
        </Stack>
      </Tooltip>
      {/* Italic */}
      <Tooltip arrow={true} placement="top" title="Italic (Ctrl+I)">
        <Stack
          justifyContent="center"
          onMouseDown={(event) => {
            event.preventDefault()
            toggleItalicMark(editor)
          }}
          sx={{
            ...iconButtonStyle,
            ...iconButtonHoverStyle,
          }}
        >
          <FormatItalicOutlined fontSize="small" />
        </Stack>
      </Tooltip>
      {/* Underline */}
      <Tooltip arrow={true} placement="top" title="Underline (Ctrl+U)">
        <Stack
          justifyContent="center"
          onMouseDown={(event) => {
            event.preventDefault()
            toggleUnderlineMark(editor)
          }}
          sx={{
            ...iconButtonStyle,
            ...iconButtonHoverStyle,
          }}
        >
          <FormatUnderlinedOutlined fontSize="small" />
        </Stack>
      </Tooltip>
      {/* Strikethrough */}
      <Tooltip arrow={true} placement="top" title="Strikethrough (Ctrl+S)">
        <Stack
          justifyContent="center"
          onMouseDown={(event) => {
            event.preventDefault()
            toggleStrikethroughMark(editor)
          }}
          sx={{
            ...iconButtonStyle,
            ...iconButtonHoverStyle,
          }}
        >
          <StrikethroughSOutlined fontSize="small" />
        </Stack>
      </Tooltip>
      {/* Bulleted List */}
      <Tooltip arrow={true} placement="top" title="Bulleted List">
        <Stack
          justifyContent="center"
          onMouseDown={(event) => {
            event.preventDefault()
            toggleBulletedList(editor)
          }}
          sx={{
            ...iconButtonStyle,
            ...iconButtonHoverStyle,
            ...(isBulletedListActive && {
              backgroundColor: 'rgba(0, 0, 0, 0.12)',
            }),
          }}
        >
          <FormatListBulletedOutlined fontSize="small" />
        </Stack>
      </Tooltip>
      {/* Numbered List */}
      <Tooltip arrow={true} placement="top" title="Numbered List">
        <Stack
          justifyContent="center"
          onMouseDown={(event) => {
            event.preventDefault()
            toggleNumberedList(editor)
          }}
          sx={{
            ...iconButtonStyle,
            ...iconButtonHoverStyle,
            ...(isNumberedListActive && {
              backgroundColor: 'rgba(0, 0, 0, 0.12)',
            }),
          }}
        >
          <FormatListNumberedOutlined fontSize="small" />
        </Stack>
      </Tooltip>
      {/* Indent */}
      <Tooltip arrow={true} placement="top" title="Indent (Tab)">
        <Stack
          justifyContent="center"
          onMouseDown={(event) => {
            event.preventDefault()
            indentList(editor)
          }}
          sx={{
            ...iconButtonStyle,
            ...iconButtonHoverStyle,
          }}
        >
          <FormatIndentIncreaseOutlined fontSize="small" />
        </Stack>
      </Tooltip>
      {/* Outdent */}
      <Tooltip arrow={true} placement="top" title="Outdent (Shift+Tab)">
        <Stack
          justifyContent="center"
          onMouseDown={(event) => {
            event.preventDefault()
            outdentList(editor)
          }}
          sx={{
            ...iconButtonStyle,
            ...iconButtonHoverStyle,
          }}
        >
          <FormatIndentDecreaseOutlined fontSize="small" />
        </Stack>
      </Tooltip>
    </Stack>
  )
}
