/**
 * Formats unread count with the following rules:
 * - If count > 99, returns "99+"
 * - If count > 10, returns the lower bound of the 10-range with "+" (e.g., 11-20 shows "10+", 21-30 shows "20+")
 * - Otherwise, returns the count as a string
 */
export const formatUnreadCount = (count: number): string => {
  if (count > 99) return '99+'
  if (count > 10) {
    const rounded = Math.floor(count / 10) * 10
    return `${rounded}+`
  }
  return count.toString()
}
