import { Descendant, Element as SlateElement, Text } from 'slate'

export const isValidUrl = (urlString: string) => {
  const urlPattern = new RegExp(
    '^(https?:\\/\\/)?' + // validate protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
      '(\\#[-a-z\\d_]*)?$',
    'i',
  )

  return !!urlPattern.test(urlString)
}

export const toTitleCase = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()

export const getFirstLetter = (str: string | null | undefined): string => {
  if (!str || typeof str !== 'string') return ''
  return str.split('')[0] || ''
}

export const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const extractPlainText = (html: string) => {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

export const truncate = (text: string, maxLength: number): string => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

export const normalizeUrl = (url: string) => {
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}` // default to https
  }
  return url
}

export const convertLinksToHtml = (text: string) => {
  const urlRegex =
    /((https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[^\s]*)?)/gi

  return text.replace(urlRegex, (url) => {
    const href = url.startsWith('http') ? url : `https://${url}`
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`
  })
}

/**
 * Removes extra whitespace and trailing empty HTML paragraphs from content.
 *
 * @param value Raw HTML or string input.
 * @returns Clean plain text string.
 */
export const cleanContent = (value: string | null | undefined): string => {
  return (value ?? '')
    .trim()
    .replace(/(<p>(\s|&nbsp;)*<\/p>|<p><br><\/p>|<p>\s*<br>\s*<\/p>)*$/g, '')
    .replace(/\s+/g, ' ')
}

/**
 * Converts HTML content into clean plain text by stripping all tags
 * and collapsing extra whitespace.
 *
 * @param value Raw HTML or string input.
 * @returns Clean plain text string.
 */
export const sanitizeContent = (value: string | null | undefined): string => {
  if (!value) return ''

  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = value

  return tempDiv.textContent?.trim().replace(/\s+/g, ' ') ?? ''
}

/**
 * Removes all @mention occurrences from the content based on the mentions array.
 * Escapes special regex characters in names to ensure safe matching.
 * Trims leading and trailing whitespace from the final string.
 */
export const removeMentions = (mentions: string[], content: string) => {
  return mentions
    .reduce((acc, name) => {
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      const regex = new RegExp(`@${escapedName}`, 'g')

      return acc.replace(regex, '')
    }, content)
    .trim()
}

/**
 * Converts Slate editor nodes into an HTML string.
 *
 * - Preserves text formatting (bold, italic, underline, strikethrough).
 * - Renders paragraphs, lists, @mentions, and links as corresponding HTML elements.
 * - Handles paragraph indentation.
 *
 * @param nodes - An array of Slate Descendant nodes to serialize.
 * @returns A string containing the HTML representation of the nodes.
 */
export const serializeToHTML = (nodes: Descendant[]): string => {
  return nodes
    .map((node) => {
      if (Text.isText(node)) {
        let text = node.text

        // Apply formatting in the correct nested order
        // Order: strikethrough -> underline -> italic -> bold (outermost to innermost)
        if (node.strikethrough) {
          text = `<s>${text}</s>`
        }
        if (node.underline) {
          text = `<u>${text}</u>`
        }
        if (node.italic) {
          text = `<em>${text}</em>`
        }
        if (node.bold) {
          text = `<strong>${text}</strong>`
        }

        return text
      }

      if (!SlateElement.isElement(node)) {
        return ''
      }

      const children = serializeToHTML(node.children)

      switch (node.type) {
        case 'paragraph': {
          const indent = (node as { indent?: number }).indent || 0
          const paddingLeft = indent * 40 // 40px per indent level
          const style =
            indent > 0 ? ` style="padding-left: ${paddingLeft}px;"` : ''
          return children.trim() === ''
            ? `<p${style}><br/></p>`
            : `<p${style}>${children}</p>`
        }

        case 'bulleted-list':
          return `<ul>${children}</ul>`

        case 'numbered-list':
          return `<ol>${children}</ol>`

        case 'list-item':
          return `<li>${children}</li>`

        case 'mention':
          return `<span style="font-size: 14px; background-color: #CDBEEE; border-radius: 16px; padding: 2px 6px;">@${node.mention.name}</span>`

        case 'link': {
          const indent = (node as { indent?: number }).indent || 0
          const paddingLeft = indent * 40 // 40px per indent level
          const style =
            indent > 0
              ? ` style="padding-left: ${paddingLeft}px; display: block;"`
              : ''
          return `<a href=${normalizeUrl(node.url)} target="_blank"${style}>${children}</a>`
        }

        default:
          return children
      }
    })
    .join('')
}

export const deserializeHTML = (html: string): Descendant[] => {
  const div = document.createElement('div')
  div.innerHTML = html

  const paragraphs: Descendant[] = []

  div.querySelectorAll('p').forEach((p) => {
    paragraphs.push({
      children: [{ text: p.textContent || '' }],
      type: 'paragraph',
    })
  })

  if (paragraphs.length > 0) return paragraphs

  return [
    {
      children: [{ text: div.textContent || html }],
      type: 'paragraph',
    },
  ]
}
