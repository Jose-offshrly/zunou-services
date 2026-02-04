import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

const MCPAuthCallbackPage = () => {
  const [searchParams] = useSearchParams()
  const hasProcessed = useRef(false)

  useEffect(() => {
    if (hasProcessed.current) {
      return
    }

    hasProcessed.current = true
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (window.opener) {
      const message = {
        code,
        error: error || errorDescription,
        state,
        type: 'MCP_AUTH_CALLBACK',
      }

      window.opener.postMessage(message, window.location.origin)

      setTimeout(() => {
        window.close()
      }, 100)
    } else {
      console.error('No opener window found')
    }
  }, [searchParams])

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        fontFamily: 'Arial, sans-serif',
        height: '100vh',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h2>Authentication Complete</h2>
        <p>You can close this window now.</p>
      </div>
    </div>
  )
}

export default MCPAuthCallbackPage
