import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { AuthUser, UserRole } from '../types'
import * as authApi from '../api/auth'

interface AuthState {
  user: AuthUser | null
  token: string | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isRole: (...roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'erp_token'
const USER_KEY = 'erp_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  })

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const raw = localStorage.getItem(USER_KEY)
    if (token && raw) {
      try {
        const user = JSON.parse(raw) as AuthUser
        setState({ user, token, loading: false })
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setState({ user: null, token: null, loading: false })
      }
    } else {
      setState((s: AuthState) => ({ ...s, loading: false }))
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await authApi.login({ username, password })
    if (!res.success || !res.token || !res.user) {
      throw new Error(res.message ?? 'Login failed')
    }
    const user: AuthUser = {
      id: res.user.id,
      username: res.user.username,
      role: res.user.role as UserRole,
    }
    localStorage.setItem(TOKEN_KEY, res.token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setState({ user, token: res.token, loading: false })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setState({ user: null, token: null, loading: false })
    window.location.href = '/login'
  }, [])

  const isRole = useCallback(
    (...roles: UserRole[]) => (state.user ? roles.includes(state.user.role) : false),
    [state.user]
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      isRole,
    }),
    [state, login, logout, isRole]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
