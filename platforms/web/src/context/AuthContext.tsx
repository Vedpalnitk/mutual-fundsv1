import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { authApi, AuthUser, setAuthToken, clearAuthToken, getAuthToken } from '@/services/api'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing token on mount
  useEffect(() => {
    const token = getAuthToken()
    if (token) {
      // For now, we'll just check if token exists
      // In production, you'd want to validate the token with the server
      try {
        // Decode JWT to get user info (basic decode, not verification)
        const payload = JSON.parse(atob(token.split('.')[1]))
        const decoded: AuthUser = {
          id: payload.sub || payload.id,
          email: payload.email,
          role: payload.role,
        }
        if (payload.ownerId) decoded.ownerId = payload.ownerId
        if (payload.allowedPages) decoded.allowedPages = payload.allowedPages
        setUser(decoded)
      } catch {
        // Invalid token, clear it
        clearAuthToken()
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    setAuthToken(response.accessToken)
    const loginUser: AuthUser = { ...response.user }
    // Include staff-specific fields if present in response
    if ((response.user as any).ownerId) loginUser.ownerId = (response.user as any).ownerId
    if ((response.user as any).allowedPages) loginUser.allowedPages = (response.user as any).allowedPages
    setUser(loginUser)
  }, [])

  const logout = useCallback(() => {
    clearAuthToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
