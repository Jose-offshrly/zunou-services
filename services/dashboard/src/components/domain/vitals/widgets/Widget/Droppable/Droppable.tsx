import { useDroppable } from '@dnd-kit/core'
import { Box } from '@mui/material'
import React from 'react'

interface DroppableProps {
  id: string
  children: React.ReactNode
}

const Droppable: React.FC<DroppableProps> = ({ id, children }) => {
  const { setNodeRef } = useDroppable({
    id,
  })

  const sx = {
    height: '100%',
    padding: 1,
    position: 'relative',
    transition: 'transform 300ms cubic-bezier(0.25, 1, 0.5, 1)',
  }

  return (
    <Box ref={setNodeRef} sx={sx}>
      {children}
    </Box>
  )
}

export { Droppable }
