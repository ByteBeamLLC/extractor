'use client'

import React from 'react'

export class GlobalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log with component stack to help isolate prod-only errors
    console.error('[GlobalErrorBoundary] error', error, 'stack', error.stack, 'componentStack', info.componentStack)
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <div className="font-semibold">Something went wrong</div>
          <p className="mt-1 break-words">{this.state.error.message}</p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-3 inline-flex items-center rounded-md border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Dismiss and retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
