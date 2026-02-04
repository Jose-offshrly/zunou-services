import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Box } from '@mui/system'
import React from 'react'

import { useVitalsContext } from '~/context/VitalsContext'

interface DraggableProps {
  id: string
  children: React.ReactNode
}

const Draggable: React.FC<DraggableProps> = ({ id, children }) => {
  const { isWidgetsDraftMode } = useVitalsContext()

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({ id })

  const style = {
    position: 'relative' as const,
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 10 : 'auto',
  }

  return (
    <Box
      ref={isWidgetsDraftMode ? setNodeRef : null}
      style={style}
      {...attributes}
      {...listeners}
    >
      {children}
    </Box>
  )
}

export { Draggable }
