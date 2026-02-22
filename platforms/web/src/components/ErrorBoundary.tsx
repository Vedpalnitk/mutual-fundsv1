import { Component, ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      const isDev = process.env.NODE_ENV === 'development'

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
            background: '#F8FAFC',
            color: '#1E293B',
          }}
        >
          <div
            style={{
              maxWidth: '28rem',
              textAlign: 'center',
              padding: '2.5rem',
              borderRadius: '1rem',
              background: '#FFFFFF',
              border: '1px solid rgba(59, 130, 246, 0.08)',
              boxShadow: '0 4px 24px rgba(59, 130, 246, 0.06)',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EF4444"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginBottom: '1rem' }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1.5rem' }}>
              An unexpected error occurred. Please try reloading the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.625rem 1.5rem',
                borderRadius: '9999px',
                border: 'none',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.06)',
              }}
            >
              Reload Page
            </button>
            {isDev && this.state.error && (
              <pre
                style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  fontSize: '0.75rem',
                  textAlign: 'left',
                  overflow: 'auto',
                  maxHeight: '12rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
