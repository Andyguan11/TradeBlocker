'use client';

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabaseClient'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

type AuthPageProps = {
  mode: 'login' | 'signup'
}

export default function AuthPage({ mode }: AuthPageProps) {
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget as HTMLFormElement)
    setIsLoading(true)
    setError('')
    try {
      if (mode === 'signup') {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', formData.get('email'))
          .single()

        if (existingUser) {
          setError('An account with this email already exists. Please try logging in instead.')
          return
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.get('email') as string,
          password: formData.get('password') as string,
          options: {
            data: {
              full_name: formData.get('full_name') as string,
            },
          },
        });

        if (authError) throw authError;

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
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.get('email') as string,
          password: formData.get('password') as string,
        })

        if (error) throw error

        if (data.user) {
          console.log('User signed in successfully');
          router.push('/dashboard')
        }
      }
    } catch (error: unknown) {
      console.error(`${mode === 'signup' ? 'Signup' : 'Login'} error:`, error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: process.env.NEXT_PUBLIC_SITE_URL
        }
      });
      
      if (error) throw error;
      // Successful sign-in is handled by the auth state change listener
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  return (
    <main className={`min-h-screen bg-gray-100 flex items-center justify-center p-4 ${inter.className}`}>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-6xl w-full flex">
        {/* Left side - Auth form */}
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
                  {/* Google icon SVG path */}
                </svg>
                {mode === 'signup' ? 'Sign up' : 'Sign in'} with Google
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
              {isLoading ? `${mode === 'signup' ? 'Creating Account' : 'Signing In'}...` : (mode === 'signup' ? 'Create Account' : 'Sign In')}
            </button>
          </form>
          
          <p className="text-center text-xs text-gray-500 mt-4">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"} <a href={mode === 'signup' ? '/login' : '/signup'} className="underline hover:text-gray-700">{mode === 'signup' ? 'Login Here' : 'Sign up here'}</a>
          </p>

          {mode === 'signup' && (
            <p className="text-center text-xs text-gray-500 mt-4">
              By signing up, you agree to our{' '}
              <a href="/terms" className="underline hover:text-gray-700">Terms of Service</a>{' '}
              and{' '}
              <a href="/privacy" className="underline hover:text-gray-700">Privacy Policy</a>
            </p>
          )}
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
