import 'react-quill/dist/quill.snow.css'

import { alpha, Menu, MenuItem, Stack } from '@mui/material'
import { PulseMember } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'
import { useCallback, useMemo, useRef } from 'react'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'
import ReactQuill from 'react-quill'

import { useMentions } from '~/hooks/useMentions'
import { usePulseStore } from '~/store/usePulseStore'

export const SuggestionType = {
  ASSIGNEE: 'assignee',
} as const

interface SmartInputProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  onSelect: ({ id, name }: { id: string; name: string }) => void
  onSubmit?: () => void
  placeholder?: string
  customPulseMembers?: PulseMember[]
}

export const SmartInput = <T extends FieldValues>({
  name,
  control,
  onSelect,
  onSubmit,
  placeholder,
  customPulseMembers,
}: SmartInputProps<T>) => {
  const quillRef = useRef<ReactQuill>(null)
  const { pulseMembers } = usePulseStore()

  const selectedPulseMembers = customPulseMembers
    ? customPulseMembers
    : pulseMembers

  const {
    filteredMembers,
    menuIndex,
    setMenuIndex,
    anchorEl,
    setAnchorEl,
    updateMentionSuggestions,
    handleMentionSelect,
  } = useMentions<PulseMember>({
    allMembers: selectedPulseMembers,
    getAnchorPosition: (triggerIndex: number) => {
      const editor = quillRef.current?.getEditor()
      if (!editor) return null

      const bounds = editor.getBounds(triggerIndex)
      if (!bounds) return

      const quillEditor = quillRef.current?.editor?.root
      if (!quillEditor) return null

      const containerRect = quillEditor.getBoundingClientRect()
      const top = containerRect.top + bounds.top
      const left = containerRect.left + bounds.left

      const tempEl = document.createElement('div')
      tempEl.style.position = 'absolute'
      tempEl.style.top = `${top - 12}px`
      tempEl.style.left = `${left - 8}px`
      tempEl.style.height = '0'
      tempEl.style.width = '0'
      document.body.appendChild(tempEl)

      return tempEl
    },
    getTextBeforeCursor: () => {
      const quill = quillRef.current?.getEditor()
      if (!quill) return ''

      const range = quill.getSelection()
      if (!range) return ''

      return quill.getText(0, range.index)
    },
    insertMentionAtCursor: (member: PulseMember): number | null => {
      const quill = quillRef.current?.getEditor()
      if (!quill) return null

      const range = quill.getSelection()
      if (!range) return null

      const cursorPos = range.index
      const textBeforeCursor = quill.getText(0, cursorPos)
      const atIndex = textBeforeCursor.lastIndexOf('@')
      if (atIndex === -1) return null

      const mentionText = `@${member.user.name}`

      quill.deleteText(atIndex, cursorPos - atIndex)
      quill.insertText(atIndex, mentionText)
      quill.formatText(atIndex, mentionText.length, {
        background: alpha(theme.palette.primary.main, 0.2),
      })
      quill.format('background', false)

      return atIndex
    },
  })

  const handleSelect = (member: PulseMember) => {
    handleMentionSelect(member)

    onSelect({
      id: member.userId,
      name: member.user.name,
    })
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
          if (e.shiftKey) {
            e.preventDefault()
            e.stopPropagation()
            return
          }

          if (!anchorEl && onSubmit) {
            onSubmit()
            return
          } else {
            const selectedMember = filteredMembers[menuIndex]

            handleSelect(selectedMember)
          }
          break
        case 'ArrowDown':
          if (anchorEl) {
            setMenuIndex((prev) =>
              prev < filteredMembers.length - 1 ? prev + 1 : prev,
            )
            e.preventDefault()
            return
          }
          break
        case 'ArrowUp':
          if (anchorEl) {
            setMenuIndex((prev) => (prev > 0 ? prev - 1 : prev))
            e.preventDefault()
            return
          }
          break
        case 'ArrowLeft':
          if (anchorEl) return setAnchorEl(null)
          break
        case 'ArrowRight':
          if (anchorEl) return setAnchorEl(null)

          break
        case 'Escape':
          setMenuIndex(0)
          setAnchorEl(null)
          break
      }
    },
    [anchorEl, filteredMembers, menuIndex, handleSelect],
  )

  const modules = useMemo(
    () => ({
      clipboard: {
        matchVisual: false,
      },
      keyboard: {
        bindings: {
          enter: {
            handler: () => false,
            key: 13,
          },
        },
      },
      toolbar: false,
    }),
    [],
  )

  return (
    <Stack
      sx={{
        '& .ql-container.ql-snow': {
          border: 'none',
        },
        '& .ql-editor': {
          '& p': {
            margin: 0,
          },
          '&:focus': {
            outline: 'none',
          },
          fontSize: 16,
          overflowY: 'auto',
          padding: 2,
          wordBreak: 'break-all',
        },
        '& .ql-editor.ql-blank::before': {
          color: 'grey.400',
          fontStyle: 'normal',
        },
        '&:focus-within': {
          borderColor: 'primary.main',
          boxShadow: `inset 0 0 0 1px ${theme.palette.primary.main}`,
        },
        '&:not(:focus-within):hover': {
          boxShadow: `inset 0 0 0 1px ${theme.palette.text.primary}`,
        },
        backgroundColor: 'white',
        border: `1px solid transparent`,
        borderRadius: 1,
        boxShadow: `inset 0 0 0 1px ${theme.palette.grey[300]}`,
      }}
      width="100%"
    >
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <ReactQuill
            modules={modules}
            onChange={(value) => {
              field.onChange(value)
              updateMentionSuggestions()
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            ref={quillRef}
            style={{
              border: 'none',
              fontSize: 16,
              minHeight: '40px',
              width: '100%',
            }}
            theme="snow"
            value={field.value}
          />
        )}
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
        {selectedPulseMembers.map((member, index) => (
          <MenuItem
            key={member.id}
            onClick={() => handleSelect(member)}
            selected={menuIndex === index}
            sx={{ width: 320 }}
          >
            {member.user.name}
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  )
}
