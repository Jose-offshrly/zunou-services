import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import React, { useState } from 'react'

import { useVitalsContext } from '~/context/VitalsContext'

interface WidgetWrapperProps {
  children: React.ReactNode
}

const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ children }) => {
  const [_activeId, setActiveId] = useState<string | null>(null)
  const { widgets, setWidgets } = useVitalsContext()

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((item) => item.id === active.id)
      const newIndex = widgets.findIndex((item) => item.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newWidgets = arrayMove(widgets, oldIndex, newIndex)

        // Update positions based on new order
        const updatedWidgets = newWidgets.map((widget, index) => ({
          ...widget,
          position: index,
        }))

        setWidgets(updatedWidgets)
      }
    }

    setActiveId(null)
  }

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      sensors={sensors}
    >
      {children}
    </DndContext>
  )
}

export default WidgetWrapper
