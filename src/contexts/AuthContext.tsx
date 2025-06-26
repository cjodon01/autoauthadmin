// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { type User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
          return
        }
        
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Session fetch error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes - but don't set loading state here
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = () => {
    // Simply clear the local state - don't wait for server response
    setUser(null)
    // Attempt to sign out from server in background, but don't wait for it
    supabase.auth.signOut().catch(() => {
      // Ignore any server errors - we've already cleared local state
    })
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}