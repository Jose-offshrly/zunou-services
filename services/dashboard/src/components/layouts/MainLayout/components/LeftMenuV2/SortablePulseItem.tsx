import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Box } from '@mui/material'
import { ReactNode } from 'react'

interface SortablePulseItemProps {
  id: string
  isShaking: boolean
  children: ReactNode
}

export default function SortablePulseItem({
  id,
  isShaking,
  children,
}: SortablePulseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.5 : 1,
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        ...(isShaking && {
          '@keyframes shake': {
            '0%, 100%': { transform: 'translateX(0)' },
            '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
            '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
          },
          animation: 'shake 0.5s',
        }),
      }}
      {...attributes}
      {...listeners}
    >
      {children}
    </Box>
  )
}
