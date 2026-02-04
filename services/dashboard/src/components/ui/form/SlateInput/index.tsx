import { ArrowUpward, SendRounded } from '@mui/icons-material'
import { Divider, Stack, SxProps, Theme } from '@mui/material'
import { Button, LoadingButton } from '@zunou-react/components/form'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'
import {
  BaseEditor,
  createEditor,
  Descendant,
  Editor,
  Element,
  Point,
  Range,
  Transforms,
} from 'slate'
import { withHistory } from 'slate-history'
import {
  Editable,
  ReactEditor,
  RenderElementProps,
  RenderLeafProps,
  Slate,
  withReact,
} from 'slate-react'

import { deserializeHTML, isValidUrl } from '~/utils/textUtils'

import { AttachmentFile, Attachments } from './attachments'
import { CustomElement, CustomText, MentionType } from './custom-types'
import { DefaultElement } from './DefaultElement'
import { exitLinkWrap, isLinkActive, wrapOrUpdateLink } from './editor/helpers'
import {
  getMentionNodes,
  handleAutoListFormatting,
  handleBackspaceInList,
  indentList,
  insertMention,
  outdentList,
  resetFormatting,
  toggleBoldMark,
  toggleItalicMark,
  toggleStrikethroughMark,
  toggleUnderlineMark,
  withAutoLinking,
  withMentions,
} from './editor/utils'
import { Leaf } from './Leaf'
import { LinkElement } from './LinkElement'
import { MentionElement } from './MentionElement'
import { MentionSuggestions } from './MentionSuggestions'
import { SlateToolbar } from './SlateToolbar'

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor
    Element: CustomElement
    Text: CustomText
  }
}

interface SlateInputProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  isLoading?: boolean
  active?: boolean
  disabled?: boolean
  onCancel?: () => void
  onSubmit?: () => void
  onTyping?: (hasValue: boolean) => void
  disabledSubmit?: boolean
  mentionSuggestions?: MentionType[]
  setMentions?: React.Dispatch<React.SetStateAction<MentionType[]>>
  submitText?: string
  mode?: 'default' | 'edit'
  sx?: SxProps<Theme>
  editorRef?: React.MutableRefObject<ReactEditor | null>

  showAddMenu?: boolean
  onFileUpload?: (files: File[]) => void
  onImageUpload?: (files: File[]) => void
  onRemoveFile?: (index: number) => void
  attachmentFiles?: AttachmentFile[]
  disableAddMenu?: boolean
  disableAddMenuTooltip?: string
  hideSend?: boolean

  type: 'PULSE_CHAT' | 'TEAM_CHAT'
  placeholder?: string
  plainTextMode?: boolean
}

export const SlateInput = <T extends FieldValues>({
  name,
  control,
  active = false,
  disabled = false,
  onCancel,
  onSubmit,
  onTyping,
  isLoading,
  disabledSubmit,
  mentionSuggestions = [],
  setMentions,
  onFileUpload,
  onImageUpload,
  onRemoveFile,
  submitText = 'Save',
  mode = 'default',
  sx,
  editorRef,
  showAddMenu = false,
  attachmentFiles = [],
  disableAddMenu = false,
  disableAddMenuTooltip,
  hideSend = false,
  type,
  placeholder = 'Type your message here...',
  plainTextMode = false, // Default to formatted mode
}: SlateInputProps<T>) => {
  const renderLeaf = useCallback(
    (props: RenderLeafProps) => <Leaf {...props} />,
    [],
  )

  const renderElement = useCallback((props: RenderElementProps) => {
    switch (props.element.type) {
      case 'mention':
        return <MentionElement {...props} />
      case 'link':
        return <LinkElement {...props} />
      default:
        return <DefaultElement {...props} />
    }
  }, [])

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const ref = useRef<HTMLDivElement | null>(null)
        const [target, setTarget] = useState<Range | null>(null)
        const [search, setSearch] = useState('')
        const [suggestionIndex, setSuggestionIndex] = useState(0)
        const previousIsEmptyRef = useRef<boolean | null>(null)
        const [isInListItem, setIsInListItem] = useState(false)

        const [editor] = useState(() =>
          plainTextMode
            ? withReact(withHistory(createEditor())) // Plain editor without mentions/auto-linking
            : withAutoLinking(
                withMentions(withReact(withHistory(createEditor()))),
              ),
        )

        useEffect(() => {
          if (editorRef) {
            editorRef.current = editor
          }
        }, [editor, editorRef])

        const parsed: Descendant[] | null = useMemo(() => {
          // In plain text mode, don't try to parse JSON/HTML
          if (plainTextMode) {
            if (!field.value) {
              return [{ children: [{ text: '' }], type: 'paragraph' }]
            }
            // Convert plain text to Slate structure
            return [{ children: [{ text: field.value }], type: 'paragraph' }]
          }

          try {
            const maybeParsed = JSON.parse(field.value ?? 'null')
            if (Array.isArray(maybeParsed)) return maybeParsed
          } catch {
            // fallback to legacy HTML
          }
          return null
        }, [field.value, plainTextMode])

        const initialValueRef = useRef<Descendant[]>(
          parsed ??
            (field.value && !plainTextMode
              ? deserializeHTML(field.value)
              : [
                  {
                    children: [
                      { text: plainTextMode && field.value ? field.value : '' },
                    ],
                    type: 'paragraph',
                  },
                ]),
        )

        const mentions = useMemo(
          () =>
            plainTextMode
              ? [] // No mentions in plain text mode
              : mentionSuggestions
                  .filter((m) =>
                    m.name.toLowerCase().startsWith(search.toLowerCase()),
                  )
                  .slice(0, 10),
          [search, mentionSuggestions, plainTextMode],
        )

        const handleKeyDown = useCallback(
          (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (disabled) {
              event.preventDefault()
              return
            }

            const { key, shiftKey, ctrlKey, metaKey } = event

            // Skip all formatting shortcuts in plain text mode
            if (plainTextMode) {
              if (key === 'Enter') {
                if (shiftKey) return

                event.preventDefault()

                if (onSubmit && !disabledSubmit) {
                  onSubmit()

                  requestAnimationFrame(() => {
                    ReactEditor.focus(editor)
                  })
                }
              }
              return
            }

            if (target && mentions.length > 0) {
              switch (key) {
                case 'ArrowDown':
                  event.preventDefault()
                  setSuggestionIndex((prev) =>
                    prev >= mentions.length - 1 ? 0 : prev + 1,
                  )
                  return

                case 'ArrowUp':
                  event.preventDefault()
                  setSuggestionIndex((prev) =>
                    prev <= 0 ? mentions.length - 1 : prev - 1,
                  )
                  return

                case 'Tab':
                case 'Enter':
                  event.preventDefault()
                  Transforms.select(editor, target)
                  insertMention(editor, mentions[suggestionIndex])
                  setTarget(null)
                  return

                case 'Escape':
                  event.preventDefault()
                  setTarget(null)
                  return
              }
            }

            if (isLinkActive(editor)) {
              switch (key) {
                case ' ':
                  event.preventDefault()
                  exitLinkWrap(editor)
                  Transforms.insertText(editor, ' ')
                  return

                case 'Enter':
                  event.preventDefault()
                  exitLinkWrap(editor)
                  Transforms.splitNodes(editor, { always: true })
                  return
              }
            }

            if (ctrlKey || metaKey) {
              switch (key.toLowerCase()) {
                case 'b':
                  event.preventDefault()
                  toggleBoldMark(editor)
                  return

                case 'i':
                  event.preventDefault()
                  toggleItalicMark(editor)
                  return

                case 'u':
                  event.preventDefault()
                  toggleUnderlineMark(editor)
                  return

                case 's':
                  event.preventDefault()
                  toggleStrikethroughMark(editor)
                  return
              }
            }

            // Handle Tab for indent/outdent
            if (key === 'Tab') {
              event.preventDefault()
              if (shiftKey) {
                outdentList(editor)
              } else {
                indentList(editor)
              }
              return
            }

            // Handle Backspace for list items
            if (key === 'Backspace') {
              if (handleBackspaceInList(editor)) {
                event.preventDefault()
                return
              }
            }

            // Handle auto-formatting for lists when space is pressed
            if (key === ' ') {
              if (handleAutoListFormatting(editor)) {
                event.preventDefault()
                // Insert the space after converting to list
                Transforms.insertText(editor, ' ')
                return
              }
            }

            if (key === 'Enter') {
              if (shiftKey) return

              event.preventDefault()

              if (onSubmit && !disabledSubmit) {
                onSubmit()

                requestAnimationFrame(() => {
                  ReactEditor.focus(editor)
                })
              }
            }
          },
          [
            mentions,
            editor,
            suggestionIndex,
            target,
            onSubmit,
            disabledSubmit,
            disabled,
            plainTextMode,
          ],
        )

        const handleChange = useCallback(
          (value: Descendant[]) => {
            if (disabled) return

            // Check if we're in a list item
            const { selection } = editor
            if (selection) {
              // Find the block element that contains the selection
              const blockEntry = Editor.above(editor, {
                at: selection,
                match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
              })

              if (blockEntry) {
                const [blockNode] = blockEntry
                setIsInListItem(
                  Element.isElement(blockNode) &&
                    blockNode.type === 'list-item',
                )
              } else {
                setIsInListItem(false)
              }
            } else {
              setIsInListItem(false)
            }

            // In plain text mode, extract text only
            if (plainTextMode) {
              const plainText = value
                .map((node) => {
                  if (Element.isElement(node)) {
                    return Editor.string(editor, [
                      editor.children.indexOf(node),
                    ])
                  }
                  return ''
                })
                .join('\n')

              field.onChange(plainText)
            } else {
              // Skip mention and auto-linking logic in plain text mode
              const { selection } = editor

              if (selection && Range.isCollapsed(selection)) {
                const [start] = Range.edges(selection)
                const blockEntry = Editor.above(editor, {
                  match: (n) =>
                    Element.isElement(n) && Editor.isBlock(editor, n),
                })

                let blockStart: Point = start
                if (blockEntry) {
                  const [_blockNode, blockPath] = blockEntry
                  blockStart = Editor.start(editor, blockPath)
                }

                let beforePoint = start
                let beforeText = ''

                while (Point.compare(beforePoint, blockStart) > 0) {
                  const charBefore = Editor.before(editor, beforePoint, {
                    unit: 'character',
                  })
                  if (!charBefore) break

                  const range = Editor.range(editor, charBefore, beforePoint)
                  const text = Editor.string(editor, range)
                  if (/\s/.test(text)) break

                  beforeText = text + beforeText
                  beforePoint = charBefore
                }

                // Mentions
                const beforeMatch = beforeText.match(/^@(\w*)$/)
                const after = Editor.after(editor, start)
                const afterRange = Editor.range(editor, start, after)
                const afterText = Editor.string(editor, afterRange)
                const afterMatch = afterText.match(/^(\s|$)/)

                if (beforeMatch && afterMatch) {
                  setTarget(Editor.range(editor, beforePoint, start))
                  setSearch(beforeMatch[1] ?? '')
                  setSuggestionIndex(0)
                  field.onChange(JSON.stringify(value))
                  return
                }

                // Auto-linking
                if (beforeText && isValidUrl(beforeText)) {
                  const urlRange = Editor.range(editor, beforePoint, start)
                  wrapOrUpdateLink(editor, beforeText, urlRange)
                }
              }

              setTarget(null)

              const mentions = getMentionNodes(editor).map((n) => n.mention)
              setMentions?.(mentions)

              field.onChange(JSON.stringify(value))
            }

            // Calculate if editor is empty based on current value
            const firstChild = value[0]
            const currentIsEmpty =
              !firstChild ||
              !Element.isElement(firstChild) ||
              Editor.isEmpty(editor, firstChild)

            // Only call onTyping when the empty/filled state actually changes
            if (previousIsEmptyRef.current !== currentIsEmpty) {
              previousIsEmptyRef.current = currentIsEmpty
              onTyping?.(!currentIsEmpty)
            }
          },
          [editor, field, onTyping, setMentions, disabled, plainTextMode],
        )

        // Sync external field value changes to Slate editor
        useEffect(() => {
          if (!field.value || field.value === JSON.stringify(editor.children)) {
            return
          }

          // In plain text mode, handle plain text values
          if (plainTextMode) {
            const newValue: Descendant[] = [
              { children: [{ text: field.value }], type: 'paragraph' },
            ]

            Transforms.delete(editor, {
              at: {
                anchor: Editor.start(editor, []),
                focus: Editor.end(editor, []),
              },
            })
            Transforms.insertNodes(editor, newValue, { at: [0] })

            if (editor.children.length > 1) {
              Transforms.removeNodes(editor, { at: [1] })
            }

            const endPoint = Editor.end(editor, [0])
            Transforms.select(editor, endPoint)
            return
          }

          try {
            const newValue: Descendant[] = JSON.parse(field.value)
            if (Array.isArray(newValue) && newValue.length > 0) {
              // Replace editor content
              Transforms.delete(editor, {
                at: {
                  anchor: Editor.start(editor, []),
                  focus: Editor.end(editor, []),
                },
              })
              Transforms.insertNodes(editor, newValue, { at: [0] })

              // Remove the default empty paragraph that gets created
              if (editor.children.length > newValue.length) {
                Transforms.removeNodes(editor, { at: [newValue.length] })
              }

              // Move cursor to end of last node
              const lastNodePath = [newValue.length - 1]
              const endPoint = Editor.end(editor, lastNodePath)
              Transforms.select(editor, endPoint)
            }
          } catch {
            // If not JSON, try HTML
            const newValue = deserializeHTML(field.value)
            Transforms.delete(editor, {
              at: {
                anchor: Editor.start(editor, []),
                focus: Editor.end(editor, []),
              },
            })
            Transforms.insertNodes(editor, newValue, { at: [0] })

            // Remove extra empty paragraph if it exists
            if (editor.children.length > newValue.length) {
              Transforms.removeNodes(editor, { at: [newValue.length] })
            }

            const lastNodePath = [newValue.length - 1]
            const endPoint = Editor.end(editor, lastNodePath)
            Transforms.select(editor, endPoint)
          }
        }, [field.value, editor, plainTextMode])

        // Set typing state to falsy on field reset
        useEffect(() => {
          const firstChild = editor.children[0]
          const currentIsEmpty =
            !firstChild ||
            !Element.isElement(firstChild) ||
            Editor.isEmpty(editor, firstChild)

          // Only call onTyping when the empty/filled state actually changes
          if (previousIsEmptyRef.current !== currentIsEmpty) {
            previousIsEmptyRef.current = currentIsEmpty
            onTyping?.(!currentIsEmpty)
          }
        }, [field.value, editor, onTyping])

        // Clear out slate input on field reset
        useEffect(() => {
          const isFieldCleared = field.value === '' || field.value === null

          if (isFieldCleared) {
            // Reset all formatting (marks, lists, indentation)
            resetFormatting(editor)

            Transforms.delete(editor, {
              at: {
                anchor: Editor.start(editor, []),
                focus: Editor.end(editor, []),
              },
            })

            Transforms.select(editor, Editor.start(editor, []))
          }
        }, [field.value, editor])

        // Position mention dropdown
        useEffect(() => {
          if (target && mentions.length > 0 && ref.current && !plainTextMode) {
            const el = ref.current
            const domRange = ReactEditor.toDOMRange(editor, target)
            const rect = domRange.getBoundingClientRect()
            el.style.top = `${rect.top + window.pageYOffset}px`
            el.style.left = `${rect.left + window.pageXOffset}px`
          }
        }, [
          mentions.length,
          editor,
          suggestionIndex,
          search,
          target,
          plainTextMode,
        ])

        return (
          <Slate
            editor={editor}
            initialValue={initialValueRef.current}
            onChange={handleChange}
          >
            <Stack
              bgcolor="background.paper"
              border={1}
              borderColor={active ? 'primary.main' : 'divider'}
              paddingX={2}
              paddingY={1}
              spacing={1}
              sx={{
                ...sx,
                ...(disabled && { opacity: 0.6, pointerEvents: 'none' }),
              }}
            >
              <Editable
                onKeyDown={handleKeyDown}
                placeholder={isInListItem ? '' : placeholder}
                readOnly={disabled}
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                style={{
                  marginTop: 8,
                  maxHeight: 160,
                  minHeight: 40,
                  outline: 'none',
                  overflow: 'auto',
                }}
              />

              <Attachments
                attachmentFiles={attachmentFiles}
                onRemoveFile={onRemoveFile}
              />

              {!plainTextMode && <Divider />}
              <Stack
                alignItems="center"
                direction="row"
                justifyContent={plainTextMode ? 'flex-end' : 'space-between'}
              >
                {!plainTextMode && ( // Hide toolbar in plain text mode
                  <SlateToolbar
                    disableAddMenu={disableAddMenu || disabled}
                    disableAddMenuTooltip={disableAddMenuTooltip}
                    editor={editor}
                    onFileUpload={onFileUpload}
                    onImageUpload={onImageUpload}
                    showAddMenu={showAddMenu}
                  />
                )}
                {mode === 'edit' ? (
                  <Stack direction="row" spacing={1}>
                    <Button
                      color="inherit"
                      disabled={disabled}
                      onClick={onCancel}
                      size="small"
                      variant="outlined"
                    >
                      Cancel
                    </Button>
                    <LoadingButton
                      disabled={disabledSubmit || disabled}
                      loading={isLoading}
                      size="small"
                      type="submit"
                      variant="contained"
                    >
                      {submitText}
                    </LoadingButton>
                  </Stack>
                ) : !hideSend ? (
                  <Button
                    disabled={disabledSubmit || disabled}
                    size="small"
                    sx={{
                      aspectRatio: '1 / 1',
                      borderRadius: 3,
                      padding: 1,
                    }}
                    type="submit"
                    variant="contained"
                  >
                    {type === 'TEAM_CHAT' && <SendRounded fontSize="small" />}

                    {type === 'PULSE_CHAT' && <ArrowUpward fontSize="small" />}
                  </Button>
                ) : null}
              </Stack>
            </Stack>
            {target && mentions.length > 0 && !disabled && !plainTextMode && (
              <MentionSuggestions
                index={suggestionIndex}
                mentions={mentions}
                onSelect={(mention) => {
                  Transforms.select(editor, target)
                  insertMention(editor, mention)
                  setTarget(null)
                }}
                refEl={ref}
              />
            )}
          </Slate>
        )
      }}
    />
  )
}
