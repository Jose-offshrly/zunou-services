import 'react-quill/dist/quill.snow.css'

import { SendRounded } from '@mui/icons-material'
import { darken, Menu, MenuItem, Stack } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Form, IconButton } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { useEffect } from 'react'
import { Control } from 'react-hook-form'
import ReactQuill from 'react-quill'

import { ThreadMessageInput } from '~/schemas/ThreadMessageSchema'

import { useHooks } from './hooks'

interface ChatMessageInputProps {
  handleSubmit: () => void
  control: Control<ThreadMessageInput>
  onTyping?: (hasContent: boolean) => void
  placeholder?: string
  editingMessage?: {
    id: string
    content: string
  } | null
  quillToolbarIdModifier?: string
}

const scrollbarStyles = {
  '&::-webkit-scrollbar': { width: '4px' },
  '&::-webkit-scrollbar-thumb': {
    '&:hover': { background: alpha(theme.palette.primary.main, 0.3) },
    background: alpha(theme.palette.primary.main, 0.2),
    borderRadius: '2px',
  },
  '&::-webkit-scrollbar-track': {
    background: alpha(theme.palette.primary.main, 0.1),
    borderRadius: '2px',
  },
}

export const ChatMessageInput = ({
  handleSubmit,
  control,
  onTyping,
  placeholder = 'Type your message here...',
  editingMessage,
  quillToolbarIdModifier = '',
}: ChatMessageInputProps) => {
  const {
    anchorEl,
    field,
    filteredMembers,
    handleInputChange,
    handleKeyDown,
    handleMarkMessagesAsRead,
    handleMention,
    handleSubmitMessage,
    isValidContent,
    menuIndex,
    modules,
    quillRef,
    setAnchorEl,
  } = useHooks({ control, handleSubmit, onTyping, quillToolbarIdModifier })

  // Editing logic from ChatInput
  useEffect(() => {
    if (editingMessage?.id) {
      const editor = quillRef?.current?.getEditor?.()

      // Set the content first
      field.onChange(editingMessage.content ?? '')

      // Wait for ReactQuill to render the content, then move the cursor
      setTimeout(() => {
        if (editor) {
          const length = editor.getLength()
          editor.setSelection(length - 1, 0) // Move cursor to the end
          editor.focus()
        }
      }, 0)
    }

    if (!editingMessage) {
      field.onChange('')
    }
  }, [editingMessage?.id])

  return (
    <Form
      maxWidth="xl"
      onSubmit={handleSubmitMessage}
      sx={{ padding: 0, width: '100%' }}
    >
      <Stack
        bgcolor="white"
        padding={1.5}
        spacing={1}
        sx={{
          border: `1px solid ${theme.palette.primary.main}`,
          borderRadius: 1.5,
          maxHeight: 'calc(40vh)',
          overflow: 'visible',
          position: 'relative',
        }}
        width="100%"
      >
        {/* In safari this part isn't showing its appearing way below the screen */}
        <Stack alignItems="end" direction="row" width="100%">
          <Stack
            direction="row"
            justifyContent="start"
            spacing={1}
            sx={{
              '& .ql-container.ql-snow': {
                border: 'none',
                padding: 1,
              },
              '& .ql-editor': {
                '& p': {
                  margin: 0,
                },
                '&:focus': {
                  outline: 'none',
                },
                maxHeight: 'calc(40vh - 80px)',
                overflowY: 'auto',
                padding: 0,
                wordBreak: 'break-all',
                ...scrollbarStyles,
              },
              '& .ql-toolbar': {
                display: 'none',
              },
              '.ql-container': {
                fontSize: 16,
              },
              width: '100%',
            }}
          >
            <ReactQuill
              modules={modules}
              onChange={handleInputChange}
              onFocus={handleMarkMessagesAsRead}
              onKeyDown={handleKeyDown}
              placeholder={
                editingMessage ? 'Edit your message here...' : placeholder
              }
              ref={quillRef}
              style={{
                backgroundColor: 'white',
                border: 'none',
                minHeight: '40px',
                width: '100%',
              }}
              theme="snow"
              value={field.value}
            />
            <Menu
              anchorEl={anchorEl}
              anchorOrigin={{
                horizontal: 'left',
                vertical: 'top',
              }}
              autoFocus={false}
              disableAutoFocus={true}
              onClose={() => {
                if (anchorEl) {
                  document.body.removeChild(anchorEl)
                  setAnchorEl(null)
                }
              }}
              open={Boolean(anchorEl) && filteredMembers.length > 0}
              sx={{ maxHeight: 400, width: 560 }}
              transformOrigin={{
                horizontal: 'left',
                vertical: 'bottom',
              }}
            >
              {filteredMembers.map((member, index) => (
                <MenuItem
                  key={member.id}
                  onClick={() => handleMention(member)}
                  selected={menuIndex === index}
                  sx={{ width: 320 }}
                >
                  {member.user.name}
                </MenuItem>
              ))}
            </Menu>
          </Stack>
          <IconButton
            disabled={!isValidContent(field.value)}
            sx={{
              '&:hover': {
                backgroundColor: darken(theme.palette.primary.main, 0.2),
                transition: 'background-color 0.3s',
              },
              backgroundColor: theme.palette.primary.main,
              borderRadius: 2,
              color: theme.palette.common.white,
            }}
            type="submit"
          >
            <SendRounded />
          </IconButton>
        </Stack>
        <div
          id={`toolbar_${quillToolbarIdModifier}`}
          style={{
            backgroundColor: 'white',
            border: 'none',
            borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            minHeight: '40px',
            padding: '8px 0',
          }}
        >
          <button className="ql-bold" />
          <button className="ql-italic" />
          <button className="ql-underline" />
          <button className="ql-strike" />
          <button className="ql-link" />
          <button className="ql-list" value="ordered" />
          <button className="ql-list" value="bullet" />
          <button className="ql-indent" value="-1" />
          <button className="ql-indent" value="+1" />
          <button className="ql-clean" />
        </div>
      </Stack>
    </Form>
  )
}
