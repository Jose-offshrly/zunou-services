/**
 * Extract hashtags from text using regex
 * @param text - The text to extract hashtags from
 * @returns Array of hashtag strings (without the # symbol)
 */
export const extractHashtags = (text: string): string[] => {
  const hashtagRegex = /#(\w+)/g
  const matches = text.match(hashtagRegex)
  return matches ? matches.map((tag) => tag.slice(1)) : []
}

/**
 * Convert URLs in text to clickable links
 * @param text - The text to process
 * @returns Text with URLs converted to HTML links
 */
export const convertUrlsToLinks = (text: string): string => {
  if (text.includes('<a href=')) {
    return text
  }

  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.replace(
    urlRegex,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
  )
}

/**
 * Process hashtags in text and convert them to labels
 * @param text - The text to process
 * @param onAddLabel - Callback function to add a label
 */
export const processHashtags = (
  text: string,
  onAddLabel?: (label: string) => void,
) => {
  if (!onAddLabel) return

  const hashtags = extractHashtags(text)
  hashtags.forEach((tag) => {
    if (tag.trim()) {
      onAddLabel(tag.trim())
    }
  })
}
