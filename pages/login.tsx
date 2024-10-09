import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'
import React from 'react'

export default function Login() {
  const supabase = useSupabaseClient()
  const router = useRouter()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) {
      console.error('Error logging in:', error)
    } else {
      router.push('/')
    }
  }

  return (
    <button onClick={handleLogin}>Login with Google</button>
  )
}