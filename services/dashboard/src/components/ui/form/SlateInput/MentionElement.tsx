import { Chip } from '@mui/material'
import { RenderElementProps, useFocused, useSelected } from 'slate-react'

import { MentionElement as MentionElementType } from './custom-types'

export const MentionElement = ({
  attributes,
  children,
  element,
}: RenderElementProps) => {
  const selected = useSelected()
  const focused = useFocused()
  const mention = element as MentionElementType

  return (
    <span {...attributes} contentEditable={false}>
      <Chip
        color={selected && focused ? 'primary' : 'default'}
        label={`@${mention.mention.name}`}
        size="small"
        style={{
          cursor: 'pointer',
          display: 'inline-flex',
          margin: '0 2px',
          verticalAlign: 'middle',
        }}
        variant="filled"
      />
      {children}
    </span>
  )
}
