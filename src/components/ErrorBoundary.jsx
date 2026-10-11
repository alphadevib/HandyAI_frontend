import { Component } from 'react'

/**
 * Last line of defence: a rendering error anywhere below shows a short note with a reload button
 * instead of unmounting the whole app and leaving a blank page.
 */
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    console.error('HandyAI crashed while rendering', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="app-crash" role="alert">
        <h1>Something went wrong</h1>
        <p>HandyAI hit an unexpected error. Reloading usually fixes it.</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload
        </button>
      </main>
    )
  }
}
