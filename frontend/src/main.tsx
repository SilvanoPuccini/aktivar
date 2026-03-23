import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './styles/globals.css'
import App from './App.tsx'

// Initialize Sentry (only when DSN is provided)
const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<SentryFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)

function SentryFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface text-on-surface">
      <div className="text-center space-y-4 px-6">
        <h1 className="text-2xl font-bold">Algo salió mal</h1>
        <p className="text-gray-400">Estamos trabajando para solucionarlo.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 rounded-full bg-primary text-on-primary font-semibold"
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}
