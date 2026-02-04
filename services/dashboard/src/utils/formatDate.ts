export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export const formatTime = (dateTimeString: string): string => {
  const date = new Date(dateTimeString)

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: true,
    minute: 'numeric',
  })
}

export const formatDateTime = (isoString: string) => {
  const date = new Date(isoString)

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    hour: 'numeric',
    hour12: true,
    minute: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)

  return formattedDate
}
