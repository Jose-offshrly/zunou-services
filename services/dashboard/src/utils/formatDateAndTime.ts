export const formatDateAndTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date
    .toLocaleDateString('en-US', {
      day: 'numeric',
      hour: 'numeric',
      hour12: true,
      minute: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    .replace(' at', ',')
}
