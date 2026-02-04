export const extractBetweenPatterns = (
  text: string,
  patternBefore: string,
  patternAfter?: string,
): string | null => {
  // Find the start position after the "before" pattern
  const startIndex = text.indexOf(patternBefore)

  if (startIndex === -1) {
    return null // Pattern before not found
  }

  // Calculate where the content starts (after the before pattern)
  const contentStart = startIndex + patternBefore.length

  // If no after pattern is provided, extract to the end of the string
  if (!patternAfter) {
    return text.substring(contentStart)
  }

  // Find the end position where the "after" pattern begins
  const endIndex = text.indexOf(patternAfter, contentStart)
  if (endIndex === -1) {
    return null // Pattern after not found
  }

  // Extract and return the string between the patterns
  return text.substring(contentStart, endIndex)
}
