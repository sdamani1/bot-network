'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export type AuthRole = 'client' | 'bot_owner' | null

export interface AuthUser {
  id: string
  email: string
  role: AuthRole
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (
    email: string,
    password: string,
    role: 'client' | 'bot_owner'
  ) => Promise<{ error: string | null; needsConfirm: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => null,
  signUp: async () => ({ error: null, needsConfirm: false }),
  signOut: async () => {},
})

function toAuthUser(supabaseUser: User | null | undefined): AuthUser | null {
  if (!supabaseUser) return null
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    role: (supabaseUser.user_metadata?.role as AuthRole) ?? null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(toAuthUser(session?.user))
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toAuthUser(session?.user))
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  const signUp = async (
    email: string,
    password: string,
    role: 'client' | 'bot_owner'
  ): Promise<{ error: string | null; needsConfirm: boolean }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    })
    if (error) return { error: error.message, needsConfirm: false }
    const needsConfirm = !!data.user && !data.session
    return { error: null, needsConfirm }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
