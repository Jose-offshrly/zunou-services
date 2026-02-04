import 'react-quill/dist/quill.snow.css'

import { Box } from '@mui/material'
import ReactQuill, { Quill } from 'react-quill'

// Custom Clipboard module
interface QuillEditor {
  root: HTMLElement
  getSelection: () => { index: number; length: number } | null
  insertText: (index: number, text: string) => void
  setSelection: (index: number, length: number) => void
  format: (format: string, value?: unknown) => void
  getFormat: () => Record<string, unknown>
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

// RichTextEditor Component
interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  error?: boolean
  quillRef?: React.RefObject<ReactQuill>
}

const RichTextEditor = ({
  value,
  onChange,
  placeholder = 'Type here...',
  minHeight = 150,
  error = false,
  quillRef,
}: RichTextEditorProps) => {
  const modules = {
    // Disable built-in toolbar
    clipboard: {
      matchVisual: false,
    },
    toolbar: false,
  }

  const formats = [
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'link',
  ]

  const borderColor = error ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)'

  return (
    <Box
      sx={{
        '& .ql-container': {
          border: `1px solid ${borderColor}`,
          borderRadius: '4px',
          fontSize: '14px',
          minHeight: `${minHeight}px`,
        },
        '& .ql-editor': {
          '& a': {
            '&:hover': {
              color: '#1565c0 !important',
            },
            '&:visited': {
              color: '#7b1fa2 !important',
            },
            color: '#1976d2 !important',
            cursor: 'pointer !important',
            textDecoration: 'underline !important',
          },
          fontSize: '14px',
          minHeight: `${minHeight}px`,
        },
        '& .ql-editor.ql-blank::before': {
          color: 'rgba(0, 0, 0, 0.6)',
          fontStyle: 'normal',
        },
      }}
    >
      <ReactQuill
        formats={formats}
        modules={modules}
        onChange={onChange}
        placeholder={placeholder}
        ref={quillRef}
        theme="snow"
        value={value}
      />
    </Box>
  )
}

export default RichTextEditor

// LinkModal Component (simplified)
// interface LinkModalProps {
//   isOpen: boolean
//   onClose: () => void
//   onSubmit: (url: string) => void
// }

// const LinkModal = ({ isOpen, onClose, onSubmit }: LinkModalProps) => {
//   const [url, setUrl] = useState('')

//   if (!isOpen) return null

//   const handleSubmit = () => {
//     if (url) {
//       onSubmit(url)
//       setUrl('')
//       onClose()
//     }
//   }

//   return (
//     <Box
//       sx={{
//         position: 'fixed',
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         backgroundColor: 'rgba(0, 0, 0, 0.5)',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         zIndex: 9999,
//       }}
//       onClick={onClose}
//     >
//       <Box
//         sx={{
//           backgroundColor: 'white',
//           padding: 3,
//           borderRadius: 2,
//           minWidth: 400,
//         }}
//         onClick={(e) => e.stopPropagation()}
//       >
//         <h3>Add Link</h3>
//         <input
//           type="text"
//           value={url}
//           onChange={(e) => setUrl(e.target.value)}
//           placeholder="Enter URL"
//           style={{
//             width: '100%',
//             padding: '8px',
//             marginBottom: '16px',
//             border: '1px solid rgba(0, 0, 0, 0.23)',
//             borderRadius: '4px',
//           }}
//         />
//         <Stack direction="row" spacing={1} justifyContent="flex-end">
//           <Button onClick={onClose}>Cancel</Button>
//           <Button onClick={handleSubmit} variant="contained">
//             Add
//           </Button>
//         </Stack>
//       </Box>
//     </Box>
//   )
// }
