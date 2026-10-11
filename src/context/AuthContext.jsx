import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(getToken()))

  // A stored token may have expired while the tab was closed, so it is verified once on load
  // rather than trusted.
  useEffect(() => {
    if (!getToken()) {
      return undefined
    }
    let cancelled = false
    api
      .me()
      .then((profile) => {
        if (!cancelled) setUser(profile)
      })
      .catch(() => {
        if (!cancelled) {
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const result = await api.login(credentials)
    setToken(result.token)
    setUser(result.user)
    return result.user
  }, [])

  /** Resolves to the user, or to {pendingEmail, emailSent} when the email must be confirmed. */
  const register = useCallback(async (payload) => {
    const result = await api.register(payload)
    if (result.verificationRequired) {
      return { pendingEmail: result.pendingEmail, emailSent: result.emailSent }
    }
    setToken(result.token)
    setUser(result.user)
    return result.user
  }, [])

  const verifyEmail = useCallback(async (token) => {
    const result = await api.verifyEmail(token)
    setToken(result.token)
    setUser(result.user)
    return result.user
  }, [])

  const updateProfile = useCallback(async (payload) => {
    const updated = await api.updateProfile(payload)
    setUser(updated)
    return updated
  }, [])

  const logout = useCallback(() => {
    if (getToken()) api.logout()
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      verifyEmail,
      updateProfile,
      logout,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
    }),
    [user, loading, login, register, verifyEmail, updateProfile, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
