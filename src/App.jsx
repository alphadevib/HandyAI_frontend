import Announcements from './components/Announcements'
import FloatingBars from './components/FloatingBars'
import SuggestionDialog from './components/SuggestionDialog'
import Footer from './components/Footer'
import Intro from './components/Intro'
import Navbar from './components/Navbar'
import Spinner from './components/Spinner'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PrefsProvider } from './context/PrefsContext'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import { usePresence } from './hooks'
import { matchPath, navigate, useRoute } from './router'
import { lazy, Suspense, useEffect } from 'react'
import './App.css'

// The home page ships with the first load; every other page is its own chunk, fetched the first
// time someone opens it, so the storefront paints without waiting for the admin or chat code.
const pages = {
  admin: () => import('./pages/Admin'),
  categories: () => import('./pages/Categories'),
  chat: () => import('./pages/Chat'),
  login: () => import('./pages/Login'),
  marketplace: () => import('./pages/Marketplace'),
  profile: () => import('./pages/Profile'),
  subscriptions: () => import('./pages/Subscriptions'),
  toolDetail: () => import('./pages/ToolDetail'),
  verifyEmail: () => import('./pages/VerifyEmail'),
}
const Admin = lazy(pages.admin)
const Categories = lazy(pages.categories)
const Chat = lazy(pages.chat)
const Login = lazy(pages.login)
const Marketplace = lazy(pages.marketplace)
const Profile = lazy(pages.profile)
const Subscriptions = lazy(pages.subscriptions)
const ToolDetail = lazy(pages.toolDetail)
const VerifyEmail = lazy(pages.verifyEmail)

/** Once the browser is idle, warm the pages most visitors open next. */
function usePrefetchPages() {
  useEffect(() => {
    const next = [pages.marketplace, pages.toolDetail, pages.chat, pages.categories, pages.login]
    const warm = () => next.forEach((load) => load().catch(() => {}))
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warm, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const timer = setTimeout(warm, 2500)
    return () => clearTimeout(timer)
  }, [])
}

/** Pages that need an account send guests to sign in, then straight back. */
function RequireUser({ children, admin = false, notice }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const path = useRoute()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true, state: { notice, returnTo: path } })
    }
  }, [loading, isAuthenticated, notice, path])

  if (loading || !isAuthenticated) return <Spinner label="Checking your account" />
  if (admin && !isAdmin) return <NotFound />
  return children
}

function Routes() {
  const path = useRoute()

  const tool = matchPath('/tools/:slug', path)
  if (tool) return <ToolDetail key={tool.slug} slug={tool.slug} />

  switch (path) {
    case '/':
    case '':
      return <Home />
    case '/categories':
      return <Categories />
    case '/marketplace':
      return <Marketplace />
    case '/chat':
      return <Chat />
    case '/login':
      return <Login mode="login" />
    case '/signup':
      return <Login mode="signup" />
    case '/verify-email':
      return <VerifyEmail />
    case '/profile':
      return (
        <RequireUser notice="Sign in to see your profile.">
          <Profile />
        </RequireUser>
      )
    case '/subscriptions':
      return (
        <RequireUser notice="Sign in to see and manage your subscriptions.">
          <Subscriptions />
        </RequireUser>
      )
    case '/admin':
      return (
        <RequireUser admin notice="Sign in with an admin account.">
          <Admin />
        </RequireUser>
      )
    default:
      return <NotFound />
  }
}

/** Re-keyed on every route so each page fades in instead of snapping into place. */
function PageTransition({ children }) {
  const path = useRoute()
  return (
    <main id="main" key={path} className="page-enter">
      <Suspense fallback={<Spinner label="Loading" />}>{children}</Suspense>
    </main>
  )
}

/** Lives inside AuthProvider so a heartbeat carries the signed-in user's token. */
function Presence() {
  usePresence()
  return null
}

export default function App() {
  usePrefetchPages()
  return (
    <AuthProvider>
      <PrefsProvider>
        <Presence />
        <div className="app-shell">
          <Navbar />
          <PageTransition>
            <Routes />
          </PageTransition>
          <Footer />
          <FloatingBars />
          <Announcements />
          <SuggestionDialog />
        </div>
        <Intro />
      </PrefsProvider>
    </AuthProvider>
  )
}
