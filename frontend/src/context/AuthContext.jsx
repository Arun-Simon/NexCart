import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Restore session on mount ────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) { setLoading(false); return }

    authApi.me()
      .then(({ data }) => setUser(data.data))
      .catch(() => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Listen for forced logout (interceptor fires auth:logout event) ──────────
  useEffect(() => {
    const handle = () => { setUser(null) }
    window.addEventListener('auth:logout', handle)
    return () => window.removeEventListener('auth:logout', handle)
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password })
    localStorage.setItem('accessToken',  data.data.accessToken)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    setUser(data.data.user)
    return data.data.user
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload)
    return data.data
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      try { await authApi.logout(refreshToken) } catch (_) {}
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuth: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
