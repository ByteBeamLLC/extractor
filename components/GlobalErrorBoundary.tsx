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

  render() {
    // Keep rendering children so we can see subsequent errors in the console
    return this.props.children
  }
}
