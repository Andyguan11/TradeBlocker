import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const handleSignIn = async (email, password) => {
    const { user, error } = await supabase.auth.signIn({ email, password })
    if (error) console.error('Error signing in:', error.message)
    // Handle successful sign-in
  }

  // Rest of your component code...
}
