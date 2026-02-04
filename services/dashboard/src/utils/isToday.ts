export const isToday = (date: string) => {
  const today = new Date()
  const compareDate = new Date(date)
  return (
    today.getDate() === compareDate.getDate() &&
    today.getMonth() === compareDate.getMonth() &&
    today.getFullYear() === compareDate.getFullYear()
  )
}
