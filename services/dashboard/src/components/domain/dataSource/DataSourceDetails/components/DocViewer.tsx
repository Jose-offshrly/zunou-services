import { Card } from '@zunou-react/components/layout'
import parse, { HTMLReactParserOptions } from 'html-react-parser'
import mammoth from 'mammoth'
import { useEffect, useRef, useState } from 'react'

interface DocumentViewerProps {
  url: string
  query?: string
  pageNumber?: number
}

interface CustomDomNode {
  type: string
  data?: string
  name?: string
  attribs?: Record<string, string>
}

const HighlightedContent = ({
  htmlContent,
  searchTerm,
}: {
  htmlContent: string
  searchTerm: string
}) => {
  const options: HTMLReactParserOptions = {
    replace: (domNode: CustomDomNode) => {
      if (domNode.type === 'text' && searchTerm) {
        const text = domNode.data ?? ''
        const regex = new RegExp(
          `(${searchTerm.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`,
          'gi',
        )
        const parts = text.split(regex)
        if (parts.length > 1) {
          return (
            <>
              {parts.map((part: string, index: number) =>
                regex.test(part) ? <mark key={index}>{part}</mark> : part,
              )}
            </>
          )
        }
      }
      if (domNode.name === 'img' && domNode.attribs) {
        return (
          <img
            {...domNode.attribs}
            style={{ height: 'auto', maxWidth: '100%' }}
          />
        )
      }
    },
  }

  return <div>{parse(htmlContent, options)}</div>
}

const DocViewer = ({ url, pageNumber, query }: DocumentViewerProps) => {
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [error, setError] = useState<Error | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchAndConvert = async () => {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer })
        setHtmlContent(result.value)
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err)
        } else {
          setError(new Error(String(err)))
        }
      }
    }

    fetchAndConvert()
  }, [url])

  useEffect(() => {
    if (htmlContent && cardRef.current) {
      requestAnimationFrame(() => {
        const container = cardRef.current!
        const targetOffset =
          (pageNumber ? pageNumber - 1 : 0) * container.clientHeight
        container.scrollTo({ behavior: 'smooth', top: targetOffset })
      })
    }
  }, [htmlContent, pageNumber])

  if (error) {
    return <div>Error loading document: {error.message}</div>
  }

  return (
    <Card
      ref={cardRef}
      style={{
        border: '1px solid lightgray',
        borderRadius: '5px',
        height: '580px',
        overflowX: 'auto',
        overflowY: 'auto',
        padding: '1rem',
        width: '100%',
      }}
    >
      <HighlightedContent htmlContent={htmlContent} searchTerm={query || ''} />
    </Card>
  )
}

export default DocViewer
