import 'react-quill/dist/quill.snow.css'

import { Box, Stack } from '@mui/material'
import { Note } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'
import { forwardRef, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import ReactQuill, { Quill } from 'react-quill'

interface QuillEditor {
  root: HTMLElement
  getSelection: () => { index: number; length: number } | null
  insertText: (index: number, text: string) => void
  setSelection: (index: number, length: number) => void
  clipboard: {
    dangerouslyPasteHTML: (html: string) => void
  }
}

type ClipboardConstructor = new (
  quill: QuillEditor,
  options: Record<string, unknown>,
) => {
  quill: QuillEditor
  onPaste(e: ClipboardEvent): void
}

const Clipboard = Quill.import('modules/clipboard') as ClipboardConstructor

class CustomClipboard extends Clipboard {
  onPaste(e: ClipboardEvent) {
    e.preventDefault()

    const scrollPos = this.quill.root.scrollTop

    const clipboardData =
      e.clipboardData ||
      (window as Window & { clipboardData?: DataTransfer }).clipboardData
    const text = clipboardData?.getData('text/plain') || ''
    const range = this.quill.getSelection()

    if (range) {
      this.quill.insertText(range.index, text)
      this.quill.setSelection(range.index + text.length, 0)
    }

    setTimeout(() => {
      this.quill.root.scrollTop = scrollPos
    }, 0)
  }
}

Quill.register('modules/clipboard', CustomClipboard, true)

interface NoteContentEditorProps {
  note?: Note
  editMode?: boolean
  onContentChange: (val: string) => void
  onContentKeyDown: (e: React.KeyboardEvent) => void
  onLinkClick: (e: React.MouseEvent) => void
}

export const NoteContentEditor = forwardRef<ReactQuill, NoteContentEditorProps>(
  ({ note, onContentChange, onContentKeyDown }, ref) => {
    const { t } = useTranslation('notes')

    const quillRef = useRef<ReactQuill | null>(null)

    useEffect(() => {
      if (ref && typeof ref === 'object') {
        ref.current = quillRef.current
      }
    }, [ref, quillRef.current])

    const handleContentChange = useCallback(
      (value: string) => {
        const cleanValue = value
          .replace(/\n{3,}/g, '\n\n')
          .replace(/\s+$/g, '')
          .replace(/^\s+/g, '')

        if (cleanValue !== value) {
          const editor = quillRef.current?.getEditor()
          if (editor) {
            const currentHTML = editor.root.innerHTML
            if (currentHTML !== cleanValue) {
              const range = editor.getSelection()
              editor.clipboard.dangerouslyPasteHTML(cleanValue)
              if (range) {
                editor.setSelection(range)
              }
            }
          }
        }

        onContentChange(cleanValue)
      },
      [onContentChange],
    )

    useEffect(() => {
      const editor = quillRef.current?.getEditor() as QuillEditor | undefined
      if (editor) {
        const editorElement = editor.root

        const handleEditorLinkClick = (e: MouseEvent) => {
          const target = e.target as HTMLElement
          if (target.tagName === 'A') {
            e.preventDefault()
            e.stopPropagation()
            const href = target.getAttribute('href')
            if (href) {
              window.open(href, '_blank', 'noopener,noreferrer')
            }
          }
        }

        editorElement.addEventListener('click', handleEditorLinkClick)

        return () => {
          editorElement.removeEventListener('click', handleEditorLinkClick)
        }
      }
    }, [quillRef.current])

    if (
      typeof window !== 'undefined' &&
      !document.getElementById('quill-no-border')
    ) {
      const style = document.createElement('style')
      style.id = 'quill-no-border'
      style.innerHTML = `.ql-container.ql-snow{ border: none !important;}`
      document.head.appendChild(style)
    }

    return (
      <Stack
        sx={{
          '& .ql-container': {
            background: 'transparent !important',
            border: 'none !important',
          },
          '& .ql-editor': {
            '& a': {
              '&:hover': {
                color: '#1565c0 !important',
                textDecoration: 'underline !important',
              },
              '&:visited': {
                color: '#7b1fa2 !important',
              },
              color: '#1976d2 !important',
              cursor: 'pointer !important',
              pointerEvents: 'auto !important',
              textDecoration: 'underline !important',
            },
            background: 'transparent !important',
            border: 'none !important',
            boxShadow: 'none !important',
            color: theme.palette.text.primary,
            fontSize: 14,
            paddingLeft: 0,
            paddingRight: 0,
          },
          '& .ql-editor a': {
            '&:hover': {
              color: '#1565c0 !important',
              textDecoration: 'underline !important',
            },
            '&:visited': {
              color: '#7b1fa2 !important',
            },
            color: '#1976d2 !important',
            cursor: 'pointer !important',
            pointerEvents: 'auto !important',
            textDecoration: 'underline !important',
          },
        }}
      >
        <Box
          sx={{
            '& .ql-editor': {
              fontSize: '14px',
              paddingLeft: '0px !important',
              paddingRight: '0px !important',
            },
            '& .ql-editor.ql-blank::before': {
              color: theme.palette.text.secondary,
              fontSize: '14px',
              fontStyle: 'normal',
              fontWeight: 400,
              left: 0,
              paddingLeft: 0,
            },
          }}
        >
          <ReactQuill
            modules={{
              clipboard: {
                matchVisual: false,
              },
              toolbar: false,
            }}
            onChange={handleContentChange}
            onKeyDown={onContentKeyDown}
            placeholder={t('type_your_note_here')}
            ref={quillRef}
            scrollingContainer="html"
            style={{
              background: 'transparent',
              border: 'none',
              minHeight: 120,
              padding: 0,
            }}
            theme="snow"
            value={note?.content || ''}
          />
        </Box>
      </Stack>
    )
  },
)
