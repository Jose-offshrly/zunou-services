import { useRef } from 'react'
import ReactQuill from 'react-quill'

import { processHashtags } from '../utils/textUtils'

interface UseEditorHandlingProps {
  onContentChange: (val: string) => void
}

export const useEditorHandling = ({
  onContentChange,
}: UseEditorHandlingProps) => {
  const quillRef = useRef<ReactQuill | null>(null)

  const handleContentChange = (val: string) => {
    onContentChange(val)
    processHashtags(val)
  }

  const handleFormat = (format: string, value?: unknown) => {
    const editor = quillRef.current?.getEditor()
    if (!editor) return
    editor.format(format, value ?? !editor.getFormat()[format])
  }

  const handleAddLink = (data: { text: string; url: string }) => {
    const editor = quillRef.current?.getEditor()
    if (!editor) return

    const range = editor.getSelection()
    if (range && range.length > 0) {
      // If text is selected, replace it with the linked text
      editor.deleteText(range.index, range.length)
      editor.insertText(range.index, data.text)
      editor.formatText(range.index, data.text.length, 'link', data.url)
    } else {
      // If no selection, insert at cursor position or at the end
      const insertIndex = range ? range.index : editor.getLength() - 1
      editor.insertText(insertIndex, data.text)
      editor.formatText(insertIndex, data.text.length, 'link', data.url)
    }
  }

  const handleLinkClick = (e: React.MouseEvent) => {
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

  return {
    handleAddLink,
    handleContentChange,
    handleFormat,
    handleLinkClick,
    quillRef,
  }
}
