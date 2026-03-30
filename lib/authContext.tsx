'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from './supabase'

export type AuthRole = 'client' | 'bot_owner' | null

export interface AuthUser {
  id: string
  email: string
  role: AuthRole
  full_name?: string | null
  avatar_url?: string | null
}

interface AuthContextType {
  user: AuthUser | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (
    email: string,
    password: string,
    role: 'client' | 'bot_owner'
  ) => Promise<{ error: string | null; needsConfirm: boolean }>
  signInWithGoogle: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<string | null>
  updatePassword: (newPassword: string) => Promise<string | null>
  verifyOtp: (email: string, token: string) => Promise<string | null>
  resendOtp: (email: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => null,
  signUp: async () => ({ error: null, needsConfirm: false }),
  signInWithGoogle: async () => {},
  sendPasswordReset: async () => null,
  updatePassword: async () => null,
  verifyOtp: async () => null,
  resendOtp: async () => null,
  signOut: async () => {},
})

function toAuthUser(u: User | null | undefined): AuthUser | null {
  if (!u) return null
  return {
    id: u.id,
    email: u.email ?? '',
    role: (u.user_metadata?.role as AuthRole) ?? null,
    full_name: u.user_metadata?.full_name ?? null,
    avatar_url: u.user_metadata?.avatar_url ?? null,
  }
}

// Sets/clears a lightweight cookie so middleware can check auth status.
// Note: this is a UX-level guard. RLS in Supabase enforces real security.
function syncAuthCookie(loggedIn: boolean) {
  if (typeof document === 'undefined') return
  if (loggedIn) {
    document.cookie = 'bn_auth=1; path=/; max-age=86400; SameSite=Lax'
  } else {
    document.cookie = 'bn_auth=; path=/; max-age=0; SameSite=Lax'
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authUser = toAuthUser(session?.user)
      setUser(authUser)
      syncAuthCookie(!!authUser)
      if (authUser) fetchProfile(authUser.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = toAuthUser(session?.user)
      setUser(authUser)
      syncAuthCookie(!!authUser)
      if (authUser) fetchProfile(authUser.id)
      else setProfile(null)
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

  const signInWithGoogle = async (): Promise<void> => {
    // Google OAuth — see supabase/profiles_schema.sql for setup instructions.
    // Requires Google provider enabled in Supabase Dashboard → Authentication → Providers.
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const sendPasswordReset = async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return error?.message ?? null
  }

  const updatePassword = async (newPassword: string): Promise<string | null> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return error?.message ?? null
  }

  const verifyOtp = async (email: string, token: string): Promise<string | null> => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    return error?.message ?? null
  }

  const resendOtp = async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    return error?.message ?? null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    syncAuthCookie(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user, profile, loading,
        signIn, signUp, signInWithGoogle,
        sendPasswordReset, updatePassword,
        verifyOtp, resendOtp, signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
