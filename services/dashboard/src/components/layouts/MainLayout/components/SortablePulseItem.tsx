import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Box } from '@mui/material'
import React from 'react'

const SortablePulseItem = ({
  id,
  children,
  isShaking,
}: {
  id: string
  children: React.ReactNode
  isShaking?: boolean
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    opacity: isDragging ? 0.8 : 1,
    transform: transform
      ? CSS.Transform.toString({
          scaleX: 1,
          scaleY: 1,
          x: transform.x,
          y: transform.y,
        })
      : undefined,
    transition,
    zIndex: isDragging ? 1000 : 'auto',
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        '&:active': {
          cursor: 'grabbing',
        },
        '@keyframes rotateShake': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(5deg)' },
          '75%': { transform: 'rotate(-5deg)' },
        },
        animation: isShaking ? 'rotateShake 0.3s ease-in-out' : 'none',
        cursor: 'grab',
      }}
    >
      {children}
    </Box>
  )
}

export default SortablePulseItem
