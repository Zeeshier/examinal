import { createContext, useContext, useState, useEffect } from 'react'

/**
 * AuthContext - Manages user authentication state
 * Integrated with JWT authentication
 */

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const storedToken = localStorage.getItem('examinal_token')
    const storedUser = localStorage.getItem('examinal_user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch (e) {
        // Clear invalid data
        localStorage.removeItem('examinal_token')
        localStorage.removeItem('examinal_user')
        localStorage.removeItem('examinal_refresh_token')
      }
    }
    setLoading(false)
  }, [])

  const login = (data) => {
    // Store tokens and user data
    localStorage.setItem('examinal_token', data.access_token)
    localStorage.setItem('examinal_refresh_token', data.refresh_token)
    localStorage.setItem('examinal_user', JSON.stringify(data.user))

    setToken(data.access_token)
    setUser(data.user)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('examinal_user')
    localStorage.removeItem('examinal_token')
    localStorage.removeItem('examinal_refresh_token')
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
