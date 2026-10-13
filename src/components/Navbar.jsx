import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, navigate, useRoute } from '../router'
import { BrandMark, Wordmark } from './Brand'
import CurrencySwitch from './CurrencySwitch'
import { Icon } from './Icons'
import ThemeToggle from './ThemeToggle'

const TICKER = [
  { text: 'Thirty-nine AI tools, one honest price tag each.', link: '/marketplace', cta: 'Browse the shelf' },
  { text: 'Paying monthly out of habit? Flip any listing to annual and compare.', link: '/marketplace?sort=price_asc', cta: 'See prices' },
  { text: "Can't name the tool? Describe the job instead.", link: '/chat', cta: 'Ask the concierge' },
]
const NAV = [
  { to: '/', label: 'Home', exact: true },
  { to: '/marketplace', label: 'Shop' },
  { to: '/categories', label: 'Aisles' },
  { to: '/chat', label: 'Concierge' },
]
const TICKER_MS = 5000
const TICKER_KEY = 'handyai.tickerClosed'

function tickerClosed() {
  try {
    return sessionStorage.getItem(TICKER_KEY) === '1'
  } catch {
    return false
  }
}

/** A slim bar of rotating notes above the header; each note slides up into place. */
function Ticker() {
  const [index, setIndex] = useState(0)
  const [closed, setClosed] = useState(tickerClosed)

  useEffect(() => {
    if (closed) return undefined
    const timer = setInterval(() => setIndex((value) => (value + 1) % TICKER.length), TICKER_MS)
    return () => clearInterval(timer)
  }, [closed])

  if (closed) return null
  const note = TICKER[index]
  const close = () => {
    try {
      sessionStorage.setItem(TICKER_KEY, '1')
    } catch {
      /* it just comes back next time */
    }
    setClosed(true)
  }

  return (
    <div className="ticker" role="region" aria-label="Announcements">
      <p key={index} className="ticker-line">
        {note.text}{' '}
        <Link to={note.link} className="ticker-link">
          {note.cta}
        </Link>
      </p>
      <button type="button" className="ticker-close" onClick={close} aria-label="Hide announcements">
        <Icon name="close" size={14} />
      </button>
    </div>
  )
}

/**
 * The storefront header: logo, a row of quiet text links, search and the account. On wide screens
 * the links replace the side rail; narrower screens keep the rail (see FloatingBars).
 */
export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const path = useRoute()
  const [query, setQuery] = useState('')
  const [accountOpen, setAccountOpen] = useState(false)
  const [lastPath, setLastPath] = useState(path)
  const accountRef = useRef(null)

  // The account menu should not survive a navigation, including the browser's Back button.
  if (lastPath !== path) {
    setLastPath(path)
    setAccountOpen(false)
  }

  useEffect(() => {
    if (!accountOpen) return undefined
    const close = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false)
    }
    const onKey = (event) => event.key === 'Escape' && setAccountOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [accountOpen])

  const search = (event) => {
    event.preventDefault()
    const text = query.trim()
    navigate(`/marketplace${text ? `?q=${encodeURIComponent(text)}` : ''}`)
    setQuery('')
  }

  const signOut = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="site-header">
      <Ticker />
      <div className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="brand" aria-label="HandyAI home">
            <BrandMark size={34} />
            <Wordmark />
          </Link>

          <nav className="header-links" aria-label="Sections">
            {NAV.map((item) => {
              const current = item.exact ? path === item.to : path.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={current ? 'is-active' : undefined}
                  aria-current={current ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <form className="header-search" role="search" onSubmit={search}>
            <Icon name="search" size={18} />
            <label htmlFor="header-search" className="sr-only">
              Search tools
            </label>
            <input
              id="header-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tools, tasks or tags…"
            />
            <kbd aria-hidden="true">↵</kbd>
          </form>

          <div className="nav-tools">
            <div className="header-prefs">
              <CurrencySwitch />
              <ThemeToggle />
            </div>

            {isAuthenticated ? (
              <>
                <Link to="/subscriptions" className="icon-btn header-icon" title="My stack">
                  <Icon name="layers" size={19} />
                  <span className="sr-only">My subscriptions</span>
                </Link>
                <div className="account" ref={accountRef}>
                  <button
                    type="button"
                    className="account-button"
                    aria-expanded={accountOpen}
                    aria-haspopup="menu"
                    onClick={() => setAccountOpen((open) => !open)}
                  >
                    <span className="avatar" aria-hidden="true">
                      {(user?.name ?? '?').slice(0, 1).toUpperCase()}
                    </span>
                    <span className="account-name">{user?.name?.split(' ')[0]}</span>
                  </button>
                  {accountOpen && (
                    <div className="account-menu" role="menu">
                      <p className="account-menu-head">
                        <strong>{user?.name}</strong>
                        <span>{user?.organisationName ?? user?.profession ?? user?.email}</span>
                      </p>
                      <Link to="/profile" role="menuitem">
                        <Icon name="user" size={18} /> Profile &amp; saved tools
                      </Link>
                      <Link to="/subscriptions" role="menuitem">
                        <Icon name="wallet" size={18} /> My stack
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" role="menuitem">
                          <Icon name="shield" size={18} /> Admin dashboard
                        </Link>
                      )}
                      <button type="button" role="menuitem" onClick={signOut}>
                        <Icon name="logout" size={18} /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="nav-auth">
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Sign in
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  Join free
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
