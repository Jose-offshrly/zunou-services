import {
  BaseEditor,
  Editor,
  Element,
  Node,
  Range,
  Text,
  Transforms,
} from 'slate'
import { ReactEditor } from 'slate-react'

export type CustomEditorType = BaseEditor & ReactEditor

const isBoldMarkActive = (editor: CustomEditorType): boolean => {
  const marks = Editor.marks(editor)
  return marks ? marks.bold === true : false
}

const isStrikethroughMarkActive = (editor: CustomEditorType): boolean => {
  const marks = Editor.marks(editor)
  return marks ? marks.strikethrough === true : false
}

const isUnderlineMarkActive = (editor: CustomEditorType): boolean => {
  const marks = Editor.marks(editor)
  return marks ? marks.underline === true : false
}

const isItalicMarkActive = (editor: CustomEditorType): boolean => {
  const marks = Editor.marks(editor)
  return marks ? marks.italic === true : false
}

const isLinkActive = (editor: CustomEditorType) => {
  const [linkNode] = Editor.nodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) && Element.isElement(n) && n.type === 'link',
  })
  return !!linkNode
}

const wrapOrUpdateLink = (
  editor: CustomEditorType,
  url: string,
  range: Range,
) => {
  // Find if there's already a link node under the cursor
  const [linkEntry] = Editor.nodes(editor, {
    at: range,
    match: (n) => Element.isElement(n) && n.type === 'link',
  })

  if (linkEntry) {
    const [linkNode, path] = linkEntry

    // If the link node is empty (deleted text), unwrap it
    const currentText = Node.string(linkNode)
    if (!currentText) {
      Transforms.unwrapNodes(editor, { at: path })
      return
    }

    // Update the link's text and URL dynamically
    Transforms.setNodes(
      editor,
      {
        children: [{ text: url }],
        url,
      },
      { at: path },
    )
  } else {
    // Wrap the detected text as a new link
    Transforms.wrapNodes(
      editor,
      {
        children: [{ text: url }],
        type: 'link',
        url,
      },
      { at: range, split: true },
    )
  }
}

const exitLinkWrap = (editor: Editor) => {
  const { selection } = editor
  if (!selection || !Range.isCollapsed(selection)) return

  const [linkEntry] = Editor.nodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) && Element.isElement(n) && n.type === 'link',
  })

  if (!linkEntry) return

  const [, path] = linkEntry

  Transforms.splitNodes(editor, {
    at: selection.focus,
    match: (n) => n === linkEntry[0],
  })

  const after = Editor.after(editor, path)
  if (after) {
    Transforms.select(editor, after)
  }
}

const hasTextContent = (value: unknown): boolean => {
  if (!value) return false

  if (Array.isArray(value)) {
    return value.some((node) => {
      if (Text.isText(node)) return node.text.trim().length > 0
      if ('children' in node) return hasTextContent(node.children)
      return false
    })
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return hasTextContent(parsed)
    } catch {
      return value.trim().length > 0
    }
  }

  return false
}

export {
  exitLinkWrap,
  hasTextContent,
  isBoldMarkActive,
  isItalicMarkActive,
  isLinkActive,
  isStrikethroughMarkActive,
  isUnderlineMarkActive,
  wrapOrUpdateLink,
}
