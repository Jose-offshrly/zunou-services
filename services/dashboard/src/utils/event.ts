import { EventPriority } from '@zunou-graphql/core/graphql'

export const getEventColor = (eventId: string, priority?: EventPriority) => {
  switch (priority) {
    case EventPriority.Urgent:
      return '#ff5252' // Bright red for urgent
    case EventPriority.High:
      return '#ff7979' // Light red
    case EventPriority.Medium:
      return '#ffb74d' // Light orange
    case EventPriority.Low:
      return '#81c784' // Light green
    default: {
      // Cycle through lighter colors based on event id
      const colors = [
        '#64b5f6', // Light blue
        '#ba68c8', // Light purple
        '#a1887f', // Light brown
        '#4fc3f7', // Light cyan
        '#f06292', // Light pink
        '#90a4ae', // Light blue grey
        '#4db6ac', // Light teal
      ]
      return colors[parseInt(eventId) % colors.length]
    }
  }
}
