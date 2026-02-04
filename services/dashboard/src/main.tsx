import * as Sentry from '@sentry/react'

const sentryEnvironment = (() => {
  const url = import.meta.env.VITE_APP_URL

  if (!url || url.includes('localhost') || url.includes('development')) {
    return 'development'
  }

  if (url.includes('staging')) return 'staging'
  if (url.includes('dashboard.zunou.ai')) return 'production'

  return 'development' // fallback
})()

if (sentryEnvironment === 'production') {
  // only implement on Prod for nows
  Sentry.init({
    dsn: 'https://de3550dca6ae9d5e5910076ccfee8898@o4509597961420800.ingest.us.sentry.io/4509597962665984',
    environment: sentryEnvironment,
    sendDefaultPii: true,
    // Uncomment and tune these if you later want tracing/replays
    // integrations: [browserTracingIntegration()],
    // tracesSampleRate: 0.1,
    // replaysSessionSampleRate: 0.1,
    // replaysOnErrorSampleRate: 1.0,
  })
}

// Application imports
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import Pusher from 'pusher-js'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '~/App.tsx'

declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
