import {
  Editor,
  Element as SlateElement,
  Point,
  Range,
  Transforms,
} from 'slate'

import { isValidUrl } from '~/utils/textUtils'

import {
  BulletedListElement,
  CustomEditor,
  LinkElement,
  MentionElement,
  MentionType,
  NumberedListElement,
  ParagraphElement,
} from '../custom-types'
import {
  CustomEditorType,
  isBoldMarkActive,
  isItalicMarkActive,
  isStrikethroughMarkActive,
  isUnderlineMarkActive,
} from './helpers'

const withMentions = (editor: CustomEditor) => {
  const { isInline, isVoid, markableVoid } = editor

  editor.isInline = (element: SlateElement) => {
    return element.type === 'mention' ? true : isInline(element)
  }

  editor.isVoid = (element: SlateElement) => {
    return element.type === 'mention' ? true : isVoid(element)
  }

  editor.markableVoid = (element: SlateElement) => {
    return element.type === 'mention' || markableVoid(element)
  }

  return editor
}

const withAutoLinking = (editor: CustomEditor) => {
  const { isInline, insertData } = editor

  editor.isInline = (element: SlateElement) => {
    return element.type === 'link' ? true : isInline(element)
  }

  editor.insertData = (data: DataTransfer) => {
    const text = data.getData('text/plain')

    if (text && isValidUrl(text)) {
      const linkNode: LinkElement = {
        children: [{ text }],
        type: 'link',
        url: text,
      }
      Transforms.insertNodes(editor, linkNode)
      return
    }

    insertData(data)
  }

  return editor
}

const insertMention = (editor: CustomEditor, mention: MentionType) => {
  const mentionNode: MentionElement = {
    // include @pulse in the text if its mentioned to trigger pulse AI
    children:
      mention.name === 'pulse'
        ? [{ text: `@${mention.name}` }]
        : [{ text: '' }],
    mention,
    type: 'mention',
  }

  Transforms.insertNodes(editor, mentionNode)

  const { selection } = editor

  if (selection) {
    const pointAfter = Editor.after(editor, selection.focus)
    if (pointAfter) {
      Transforms.select(editor, pointAfter)
      Transforms.insertText(editor, ' ') // insert space after mention to separate mention from the next word
    }
  }
}

const getMentionNodes = (editor: CustomEditor) => {
  const mentions: MentionElement[] = []

  for (const [node] of Editor.nodes(editor, {
    at: [],
    match: (n) =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'mention',
  })) {
    mentions.push(node as MentionElement)
  }

  return mentions
}

const toggleUnderlineMark = (editor: CustomEditorType): void => {
  const isActive = isUnderlineMarkActive(editor)
  if (isActive) {
    Editor.removeMark(editor, 'underline')
  } else {
    Editor.addMark(editor, 'underline', true)
  }
}

const toggleStrikethroughMark = (editor: CustomEditorType): void => {
  const isActive = isStrikethroughMarkActive(editor)
  if (isActive) {
    Editor.removeMark(editor, 'strikethrough')
  } else {
    Editor.addMark(editor, 'strikethrough', true)
  }
}

const toggleBoldMark = (editor: CustomEditorType): void => {
  const isActive = isBoldMarkActive(editor)
  if (isActive) {
    Editor.removeMark(editor, 'bold')
  } else {
    Editor.addMark(editor, 'bold', true)
  }
}

const toggleItalicMark = (editor: CustomEditorType): void => {
  const isActive = isItalicMarkActive(editor)
  if (isActive) {
    Editor.removeMark(editor, 'italic')
  } else {
    Editor.addMark(editor, 'italic', true)
  }
}

const LIST_TYPES = ['bulleted-list', 'numbered-list']

const isListActive = (editor: CustomEditorType, format: string): boolean => {
  const { selection } = editor
  if (!selection) return false

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    }),
  )

  return !!match
}

const toggleList = (
  editor: CustomEditorType,
  format: 'bulleted-list' | 'numbered-list',
): void => {
  const isActive = isListActive(editor, format)
  const isList = LIST_TYPES.includes(format)

  // Unwrap all lists first
  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type as string),
    split: true,
  })

  let newProperties: Partial<SlateElement>
  if (isActive) {
    // Convert list items back to paragraphs
    newProperties = {
      type: 'paragraph',
    }
    Transforms.setNodes<SlateElement>(editor, newProperties)
  } else if (isList) {
    // Convert selected blocks to list items
    newProperties = {
      type: 'list-item',
    }
    Transforms.setNodes<SlateElement>(editor, newProperties)

    // Wrap all list items in a list container
    const block: BulletedListElement | NumberedListElement =
      format === 'bulleted-list'
        ? { children: [], type: 'bulleted-list' }
        : { children: [], type: 'numbered-list' }
    Transforms.wrapNodes(editor, block, {
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n.type === 'list-item',
    })
  }
}

const toggleBulletedList = (editor: CustomEditorType): void => {
  toggleList(editor, 'bulleted-list')
}

const toggleNumberedList = (editor: CustomEditorType): void => {
  toggleList(editor, 'numbered-list')
}

const indentList = (editor: CustomEditorType): void => {
  const { selection } = editor
  if (!selection) return

  // First, try to handle list items (existing behavior)
  const [listItemMatch] = Array.from(
    Editor.nodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n.type === 'list-item',
    }),
  )

  if (listItemMatch) {
    // Find the parent list
    const [listMatch] = Array.from(
      Editor.nodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          LIST_TYPES.includes(n.type as string),
      }),
    )

    if (listMatch) {
      // Create a nested list by wrapping the current list item
      const listNode = listMatch[0] as SlateElement
      if (
        SlateElement.isElement(listNode) &&
        LIST_TYPES.includes(listNode.type as string)
      ) {
        const nestedList: BulletedListElement | NumberedListElement =
          listNode.type === 'bulleted-list'
            ? { children: [], type: 'bulleted-list' }
            : { children: [], type: 'numbered-list' }
        Transforms.wrapNodes(editor, nestedList, { split: true })
      }
    }
    return
  }

  // Handle paragraphs and other block elements
  const [blockMatch] = Array.from(
    Editor.nodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        (n.type === 'paragraph' || n.type === 'link'),
    }),
  )

  if (blockMatch) {
    const [node, path] = blockMatch
    const element = node as ParagraphElement | LinkElement
    const currentIndent = element.indent || 0
    const maxIndent = 10 // Maximum indent level (10 * 40px = 400px)
    const newIndent = Math.min(currentIndent + 1, maxIndent)

    Transforms.setNodes(editor, { indent: newIndent }, { at: path })
  }
}

const outdentList = (editor: CustomEditorType): void => {
  const { selection } = editor
  if (!selection) return

  // First, try to handle list items (existing behavior)
  const [listItemMatch] = Array.from(
    Editor.nodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n.type === 'list-item',
    }),
  )

  if (listItemMatch) {
    // Find the parent list
    const [listMatch] = Array.from(
      Editor.nodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          LIST_TYPES.includes(n.type as string),
      }),
    )

    if (listMatch) {
      const [, listPath] = listMatch
      // Check if this is a nested list (has a list parent)
      const [parentMatch] = Array.from(
        Editor.nodes(editor, {
          at: listPath,
          match: (n) =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            LIST_TYPES.includes(n.type as string),
        }),
      )

      if (parentMatch) {
        // Unwrap the nested list
        Transforms.unwrapNodes(editor, {
          match: (n) =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            LIST_TYPES.includes(n.type as string),
        })
      }
    }
    return
  }

  // Handle paragraphs and other block elements
  const [blockMatch] = Array.from(
    Editor.nodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        (n.type === 'paragraph' || n.type === 'link'),
    }),
  )

  if (blockMatch) {
    const [node, path] = blockMatch
    const element = node as ParagraphElement | LinkElement
    const currentIndent = element.indent || 0
    const newIndent = Math.max(currentIndent - 1, 0)

    if (newIndent === 0) {
      // Remove indent property if it's 0
      Transforms.setNodes(editor, { indent: undefined }, { at: path })
    } else {
      Transforms.setNodes(editor, { indent: newIndent }, { at: path })
    }
  }
}

const handleBackspaceInList = (editor: CustomEditorType): boolean => {
  const { selection } = editor
  if (!selection || !Range.isCollapsed(selection)) return false

  const [match] = Array.from(
    Editor.nodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n.type === 'list-item',
    }),
  )

  if (!match) return false

  const [listItemNode, listItemPath] = match
  const start = Editor.start(editor, listItemPath)

  // Check if cursor is at the start of the list item
  if (Point.equals(selection.anchor, start)) {
    // Check if list item is empty
    const isEmpty = Editor.isEmpty(editor, listItemNode as SlateElement)

    if (isEmpty) {
      // Find parent list before converting
      const [listMatch] = Array.from(
        Editor.nodes(editor, {
          at: listItemPath,
          match: (n) =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            LIST_TYPES.includes(n.type as string),
        }),
      )

      // Convert empty list item to paragraph
      Transforms.setNodes(editor, { type: 'paragraph' }, { at: listItemPath })

      // Unwrap from list if needed
      if (listMatch) {
        Transforms.unwrapNodes(editor, {
          match: (n) =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            LIST_TYPES.includes(n.type as string),
          split: true,
        })
      }
      return true
    } else {
      // List item has content, try to outdent
      outdentList(editor)
      return true
    }
  }

  return false
}

const handleAutoListFormatting = (editor: CustomEditorType): boolean => {
  const { selection } = editor
  if (!selection || !Range.isCollapsed(selection)) return false

  // Check if we're in a paragraph (not already in a list)
  const [match] = Array.from(
    Editor.nodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n.type === 'paragraph',
    }),
  )

  if (!match) return false

  const [, path] = match
  const start = Editor.start(editor, path)
  const range = Editor.range(editor, start, selection.anchor)
  const text = Editor.string(editor, range)

  // Check for "- " pattern (bulleted list)
  // Match text that ends with "-" (possibly with leading whitespace)
  const bulletMatch = text.match(/^(\s*)-$/)
  if (bulletMatch) {
    const matchLength = bulletMatch[0].length
    // Calculate the start point for deletion
    const deleteStart =
      matchLength > 0
        ? Editor.before(editor, selection.anchor, {
            distance: matchLength,
            unit: 'character',
          }) || start
        : start
    // Delete the "-" and any leading whitespace
    Transforms.delete(editor, {
      at: {
        anchor: deleteStart,
        focus: selection.anchor,
      },
    })

    // Convert to list item
    Transforms.setNodes<SlateElement>(
      editor,
      { type: 'list-item' },
      { at: path },
    )

    // Wrap in bulleted list
    const block: BulletedListElement = {
      children: [],
      type: 'bulleted-list',
    }
    Transforms.wrapNodes(editor, block, {
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n.type === 'list-item',
    })

    return true
  }

  // Check for "1. " pattern (numbered list)
  // Match text that ends with a number followed by "." (possibly with leading whitespace)
  const numberedListMatch = text.match(/^(\s*)(\d+)\.$/)
  if (numberedListMatch) {
    const matchLength = numberedListMatch[0].length
    // Calculate the start point for deletion
    const deleteStart =
      matchLength > 0
        ? Editor.before(editor, selection.anchor, {
            distance: matchLength,
            unit: 'character',
          }) || start
        : start
    // Delete the "1." and any leading whitespace
    Transforms.delete(editor, {
      at: {
        anchor: deleteStart,
        focus: selection.anchor,
      },
    })

    // Convert to list item
    Transforms.setNodes<SlateElement>(
      editor,
      { type: 'list-item' },
      { at: path },
    )

    // Wrap in numbered list
    const block: NumberedListElement = {
      children: [],
      type: 'numbered-list',
    }
    Transforms.wrapNodes(editor, block, {
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n.type === 'list-item',
    })

    return true
  }

  return false
}

const resetFormatting = (editor: CustomEditorType): void => {
  // Remove all formatting marks
  Editor.removeMark(editor, 'bold')
  Editor.removeMark(editor, 'italic')
  Editor.removeMark(editor, 'underline')
  Editor.removeMark(editor, 'strikethrough')

  // Unwrap all lists and convert list items to paragraphs
  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type as string),
    split: true,
  })

  // Convert all list items to paragraphs
  Transforms.setNodes(
    editor,
    { type: 'paragraph' },
    {
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n.type === 'list-item',
    },
  )

  // Remove indent from all paragraphs and links
  Transforms.setNodes(
    editor,
    { indent: undefined },
    {
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        (n.type === 'paragraph' || n.type === 'link'),
    },
  )
}

export {
  getMentionNodes,
  handleAutoListFormatting,
  handleBackspaceInList,
  indentList,
  insertMention,
  outdentList,
  resetFormatting,
  toggleBoldMark,
  toggleBulletedList,
  toggleItalicMark,
  toggleNumberedList,
  toggleStrikethroughMark,
  toggleUnderlineMark,
  withAutoLinking,
  withMentions,
}
