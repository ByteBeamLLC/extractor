"use client"

import React from "react"

type BoundaryProps = {
  children: React.ReactNode
  context?: Record<string, unknown>
}

type BoundaryState = {
  hasError: boolean
}

/**
 * Lightweight error boundary that logs rich context to the console.
 * Useful for capturing production-only render loops (React error #301).
 */
export class DataExtractionErrorBoundary extends React.Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    let gridSnapshot: any = undefined
    let gridScan: any = undefined
    if (typeof window !== "undefined") {
      try {
        gridSnapshot = (window as any).__GRID_LAST_ROWS__
      } catch (_) {
        gridSnapshot = undefined
      }
      try {
        gridScan = (window as any).__GRID_SCAN__
      } catch (_) {
        gridScan = undefined
      }
    }

    const payload = {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      componentStack: info?.componentStack,
      context: this.props.context ?? {},
      timestamp: new Date().toISOString(),
      gridSnapshot,
      gridScan,
    }

    // Log to console for quick inspection in Vercel prod.
    // eslint-disable-next-line no-console
    console.error("[DataExtractionErrorBoundary]", payload)

    // Expose on window for debugging snapshots.
    if (typeof window !== "undefined") {
      ;(window as any).__DATA_EXTRACTION_ERROR__ = payload
    }

    this.setState({ hasError: true })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
          <div>
            <div className="font-semibold">Something went wrong.</div>
            <div className="text-red-600">Check console for details. Error captured by DataExtractionErrorBoundary.</div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
