import { RenderElementProps } from 'slate-react'

export const DefaultElement = (props: RenderElementProps) => {
  const { attributes, children, element } = props

  switch (element.type) {
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>
    case 'numbered-list':
      return <ol {...attributes}>{children}</ol>
    case 'list-item':
      return <li {...attributes}>{children}</li>
    default: {
      const indent = (element as { indent?: number }).indent || 0
      const paddingLeft = indent * 40 // 40px per indent level
      return (
        <div {...attributes} style={{ paddingLeft }}>
          {children}
        </div>
      )
    }
  }
}
