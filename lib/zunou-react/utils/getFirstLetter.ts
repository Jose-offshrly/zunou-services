export const getFirstLetter = (value?: string) => {
  if (!value) return

  return value.slice(0, 1)
}
