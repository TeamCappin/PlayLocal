import { createContext, useMemo, useState, type PropsWithChildren } from 'react'

export type AuthUser = { firstname: string; lastname: string; email: string } | null

type AuthContextType = {
  user: AuthUser
  login: (u: NonNullable<AuthUser>, token?: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser>(() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? (JSON.parse(raw) as AuthUser) : null
    } catch {
      return null
    }
  })

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      login: (u, token) => {
        setUser(u)
        localStorage.setItem('user', JSON.stringify(u))
        if (token) localStorage.setItem('jwt', token)
      },
      logout: () => {
        setUser(null)
        localStorage.removeItem('user')
        localStorage.removeItem('jwt')
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
