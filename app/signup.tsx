'use client';

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabaseClient'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function SignUpPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, checking profile');
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error && error.code !== 'PGRST116') throw error;

          if (!profile) {
            console.log('Profile not found, creating new profile');
            await supabase.from('profiles').insert([
              {
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata.full_name,
              }
            ]);
          }

          console.log('Redirecting to dashboard');
          router.push('/dashboard');
        } catch (error) {
          console.error('Error:', error);
          setError('An error occurred. Please try again.');
        }
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    }
  }, [router]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const error = searchParams.get('error');
    if (error === 'user_exists') {
      setError('An account with this email already exists. Please try logging in instead.')
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.email)
        .single()

      if (existingUser) {
        setError('An account with this email already exists. Please try logging in instead.')
        return
      }

      const { data: authData, error: authError } = await supabase.auth.signUp(formData)

      if (authError) throw authError

      if (authData.user) {
        await supabase.from('profiles').insert([
          { 
            id: authData.user.id, 
            email: authData.user.email,
          }
        ])

        if (authData.session) {
          router.push('/dashboard')
        } else {
          alert('Your account has been created. Please check your email for the confirmation link to complete your registration. If you do not receive an email, please contact support.')
        }
      } else {
        alert('Signup successful, but no user returned. This is unexpected. Please contact support.')
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      setError(error.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError('Failed to sign up with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={`min-h-screen bg-gray-100 flex items-center justify-center p-4 ${inter.className}`}>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-6xl w-full flex">
        {/* Left side - Sign up form */}
        <div className="w-full lg:w-1/2 p-8 flex flex-col">
          <div className="flex flex-col items-center mb-8">
            <Image src="/logo.png" alt="TradeBlocker Logo" width={64} height={64} className="mb-4" />
            <h1 className="text-3xl font-bold">TradeBlocker</h1>
          </div>
          
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full mb-4 flex items-center justify-center border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isLoading ? 'Loading...' : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  <path fill="none" d="M1 1h22v22H1z" />
                </svg>
                Sign up with Google
              </>
            )}
          </button>
          
          <div className="text-center text-gray-500 my-4">or</div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-red-500 text-sm mb-4">
                {error}
              </div>
            )}
            {['email', 'password'].map((field) => (
              <div key={field}>
                <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
                  {field.charAt(0).toUpperCase() + field.slice(1)}*
                </label>
                <input
                  id={field}
                  type={field === 'password' ? 'password' : 'email'}
                  required
                  disabled={isLoading}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData[field as keyof typeof formData]}
                  onChange={handleChange}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          
          <p className="text-center text-xs text-gray-500 mt-4">
            Already have an account? <a href="/login" className="underline hover:text-gray-700">Login Here</a>
          </p>

          <p className="text-center text-xs text-gray-500 mt-4">
            By signing up, you agree to our{' '}
            <a href="/terms" className="underline hover:text-gray-700">Terms of Service</a>{' '}
            and{' '}
            <a href="/privacy" className="underline hover:text-gray-700">Privacy Policy</a>
          </p>
        </div>
        
        {/* Right side - Complex gradient background */}
        <div className="hidden lg:block w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-300 via-pink-400 to-purple-500"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-purple-300 to-transparent opacity-50"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-pink-300 to-transparent opacity-30"></div>
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-white opacity-10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-1/2 h-1/2 bg-pink-200 opacity-10 rounded-full filter blur-3xl"></div>
        </div>
      </div>
    </main>
  )
}