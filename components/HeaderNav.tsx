'use client'

import { Bell, ChevronDown } from "lucide-react"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { supabase } from "../utils/supabaseClient"
import { useRouter } from "next/navigation"
import { Poppins } from 'next/font/google'
import { Avatar, AvatarFallback } from "@/components/ui/Intergrationsvatar"

const poppins = Poppins({ 
  weight: ['400', '600'],
  subsets: ['latin'],
  display: 'swap',
})

const HeaderNav = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetchUserData()
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const fetchUserData = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error

      if (user) {
        console.log("User found:", user)
        const fullName = user.user_metadata?.full_name || user.email || 'User'
        const firstName = fullName.split(' ')[0]
        setFirstName(firstName)
      } else {
        console.log("No user found")
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsDropdownOpen(false)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/') // Redirect to home page after logout
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-gradient-to-b from-gray-100 to-white border-b border-gray-200 shadow-sm relative">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-xl -z-10" />
      <div className="w-1/3">
        {/* This empty div takes up 1/3 of the space */}
      </div>
      <div className="flex items-center space-x-4 z-10 w-1/3 justify-center">
        <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-full" />
        <h1 className={`text-xl font-semibold ${poppins.className}`}>Dashboard</h1>
      </div>
      <div className="flex items-center space-x-4 z-10 w-1/3 justify-end">
        <button className="p-2 rounded hover:bg-white/50 transition-colors duration-200 border border-gray-200">
          <Bell className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-px h-6 bg-gray-300"></div>
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 hover:bg-white/50 rounded p-1 transition-colors duration-200 border border-gray-200"
          >
            <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
              <AvatarFallback>{firstName ? firstName[0].toUpperCase() : ''}</AvatarFallback>
            </Avatar>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default HeaderNav;