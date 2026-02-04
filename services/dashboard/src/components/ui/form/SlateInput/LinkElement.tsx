import { RenderElementProps } from 'slate-react'

import { LinkElement as LinkElementType } from './custom-types'

export const LinkElement = ({
  attributes,
  children,
  element,
}: RenderElementProps) => {
  const linkElement = element as LinkElementType
  const indent = linkElement.indent || 0
  const paddingLeft = indent * 40 // 40px per indent level

  return (
    <a
      {...attributes}
      href={linkElement.url}
      style={{ display: 'block', paddingLeft }}
    >
      {children}
    </a>
  )
}
