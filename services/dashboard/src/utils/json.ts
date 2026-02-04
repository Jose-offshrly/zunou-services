export const isJsonObject = (str: string | undefined): boolean => {
  try {
    if (!str) return false

    const parsed = JSON.parse(str)

    return (
      typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    )
  } catch (e) {
    return false
  }
}
