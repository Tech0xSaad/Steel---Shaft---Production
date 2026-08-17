import { Component } from 'react'
import { Button } from '@/components/ui/Button'
import { AlertCircle } from 'lucide-react'

/**
 * React error boundary — catches render-phase errors in its subtree
 * and shows a graceful fallback instead of crashing the whole app.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) this.props.onReset()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 mb-4">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-surface-900 mb-1">
            Something went wrong
          </h2>
          <p className="text-sm text-surface-500 max-w-sm mb-5">
            {this.state.error?.message ?? 'An unexpected error occurred in this section.'}
          </p>
          <Button variant="secondary" onClick={this.handleReset}>
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
