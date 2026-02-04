export const formatMessage = (message?: string) => {
  if (!message) return ''

  let result = message

  // Handle \text{content} properly without affecting other braces
  while (result.includes('\\text{')) {
    const textIndex = result.indexOf('\\text{')
    const openBrace = textIndex + 6
    const closeBrace = result.indexOf('}', openBrace)

    if (closeBrace !== -1) {
      const content = result.substring(openBrace, closeBrace)
      result =
        result.substring(0, textIndex) +
        content +
        result.substring(closeBrace + 1)
    } else {
      break // No closing brace found
    }
  }

  // Replace other symbols (safe string replacements)
  result = result.split('\\times').join('×')
  result = result.split('\\approx').join('≈')
  result = result.split('\\n').join('  \n')

  return result
}
