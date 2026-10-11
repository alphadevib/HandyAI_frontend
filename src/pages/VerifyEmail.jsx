import { useEffect, useRef, useState } from 'react'
import { BrandMark } from '../components/Brand'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { Link, navigate } from '../router'

/** The landing page of the confirmation email: confirms the address and signs the person in. */
export default function VerifyEmail() {
  const { verifyEmail } = useAuth()
  const [state, setState] = useState({ status: 'working', message: '' })
  const started = useRef(false)

  useEffect(() => {
    // Once only, even when React runs effects twice in development: the link works one time.
    if (started.current) return
    started.current = true
    const token = new URLSearchParams(window.location.search).get('token')
    // Drop the token from the address bar and history straight away.
    window.history.replaceState(window.history.state, '', '/verify-email')
    if (!token) {
      Promise.resolve().then(() =>
        setState({ status: 'failed', message: 'This link is missing its code. Open it from the email again.' }),
      )
      return
    }
    verifyEmail(token)
      .then(() => {
        setState({ status: 'done', message: '' })
        setTimeout(() => navigate('/', { replace: true }), 2500)
      })
      .catch((error) => setState({ status: 'failed', message: error.message }))
  }, [verifyEmail])

  return (
    <section className="page verify-page">
      <div className="verify-card">
        <BrandMark size={56} />
        {state.status === 'working' && <Spinner label="Confirming your email" />}
        {state.status === 'done' && (
          <>
            <h1>You&apos;re in</h1>
            <p>Your email is confirmed and you are signed in. Taking you to the storefront…</p>
            <Link to="/" className="btn btn-primary btn-lg">
              Start shopping
            </Link>
          </>
        )}
        {state.status === 'failed' && (
          <>
            <h1>That link didn&apos;t work</h1>
            <p>{state.message}</p>
            <Link to="/login" className="btn btn-primary btn-lg">
              Sign in for a new link
            </Link>
          </>
        )}
      </div>
    </section>
  )
}
