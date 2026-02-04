import { useCallback, useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs'

import 'react-pdf/dist/esm/Page/TextLayer.css'

interface PdfViewerProps {
  url: string
  pageNumber?: number
  query?: string
}

const PdfViewer: React.FC<PdfViewerProps> = ({ url, pageNumber, query }) => {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [scale, setScale] = useState(1)

  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Page resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth
        setScale((width - 32) / 595)
      }
    }

    const resizeObserver = new ResizeObserver(updateWidth)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  // Page scrolling
  useEffect(() => {
    if (pageNumber && pageRefs.current[pageNumber - 1]) {
      setTimeout(() => {
        pageRefs.current[pageNumber - 1]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 500)
    }
  }, [numPages, pageNumber])

  const highlightPattern = (text: string, pattern?: string) => {
    if (!pattern) return text

    // Normalize both text and query.
    const normalizedText = text.normalize('NFC')
    const normalizedPattern = pattern.normalize('NFC')

    // Create a regex for global, case-insensitive search.
    const regex = new RegExp(normalizedPattern, 'gi')
    let match
    const matches: { start: number; end: number }[] = []

    // Find all match positions.
    while ((match = regex.exec(normalizedText)) !== null) {
      matches.push({ end: match.index + match[0].length, start: match.index })
    }

    // If no matches, return the normalized text.
    if (matches.length === 0) return normalizedText

    // If only one match exists, simply highlight that occurrence.
    if (matches.length === 1) {
      const { start, end } = matches[0]
      return (
        normalizedText.slice(0, start) +
        '<mark>' +
        normalizedText.slice(start, end) +
        '</mark>' +
        normalizedText.slice(end)
      )
    }

    const firstMatch = matches[0]
    const lastMatch = matches[matches.length - 1]

    return (
      normalizedText.slice(0, firstMatch.start) +
      '<mark>' +
      normalizedText.slice(firstMatch.start, lastMatch.end) +
      '</mark>' +
      normalizedText.slice(lastMatch.end)
    )
  }

  const textRenderer = useCallback(
    (textItem: { str: string }) => highlightPattern(textItem.str, query),
    [query],
  )

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          border: '1px solid lightgray',
          borderRadius: '5px',
          height: '580px',
          overflowX: 'auto',
          overflowY: 'auto',
          padding: '10px',
          width: '100%',
        }}
      >
        <Document
          file={url}
          loading={''}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages)
          }}
        >
          {Array.from(new Array(numPages), (_, index) => (
            <div key={index} ref={(el) => (pageRefs.current[index] = el)}>
              <Page
                customTextRenderer={textRenderer}
                pageNumber={index + 1}
                renderAnnotationLayer={false}
                renderTextLayer={true}
                scale={scale}
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  )
}

export default PdfViewer
