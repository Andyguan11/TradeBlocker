'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/Sidebarbutton"
import { Card } from "@/components/ui/SidebarCard"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Intergrationsvatar"
import { Badge } from "@/components/ui/SidebarBadge"
import { PlusIcon, ChevronRightIcon, PencilIcon, ChevronLeftIcon, Settings, X } from "lucide-react"
import { supabase } from "../utils/supabaseClient"

export function GlassySidebar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedItem, setSelectedItem] = useState('Dashboard')
  const [firstName, setFirstName] = useState('')
  const [showComingSoon, setShowComingSoon] = useState(false)

  const toggleSidebar = () => setIsExpanded(!isExpanded)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error

      if (user) {
        console.log("User found:", user)
        // The display name is stored in user.user_metadata.full_name
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

  const menuItems = [
    { name: 'Dashboard', icon: (
      <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    )},
    { name: 'Settings', icon: <Settings className="h-5 w-5 mr-3" /> },
  ]

  return (
    <div className={`${isExpanded ? 'w-64' : 'w-20'} h-screen flex-shrink-0 bg-gradient-to-b from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 p-4 flex flex-col overflow-hidden relative transition-all duration-300 border-r border-gray-200 dark:border-gray-700`}>
      <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-xl -z-10" />
      
      {isExpanded ? (
        <>
          <Button 
            onClick={toggleSidebar} 
            className="absolute top-2 right-2 p-1 rounded-full bg-white/50 dark:bg-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-600/70 transition-colors z-10"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>

          <div className="flex items-center mb-6">
            <Avatar className="h-10 w-10 mr-3 ring-2 ring-white shadow-lg">
              <AvatarFallback>{firstName ? firstName[0].toUpperCase() : ''}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm text-gray-500">Good Day 👋</div>
              <div className="font-semibold">{firstName}</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Menu</span>
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Button
                  key={item.name}
                  variant={selectedItem === item.name ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    selectedItem === item.name
                      ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                      : "hover:bg-white/50"
                  } transition-colors`}
                  onClick={() => setSelectedItem(item.name)}
                >
                  {item.icon}
                  {item.name}
                </Button>
              ))}
            </nav>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-10 w-10 ring-2 ring-white shadow-lg mb-4">
            <AvatarFallback>{firstName ? firstName[0].toUpperCase() : ''}</AvatarFallback>
          </Avatar>
          {menuItems.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              size="icon"
              className={`${
                selectedItem === item.name
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
                  : "hover:bg-white/50"
              } transition-colors`}
              onClick={() => setSelectedItem(item.name)}
            >
              <div className="h-5 w-5">
                {item.icon}
              </div>
            </Button>
          ))}
          <Button 
            onClick={toggleSidebar} 
            className="p-1 rounded-full bg-white/50 hover:bg-white/70 transition-colors z-10 mt-4"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Coming Soon Popup */}
      {showComingSoon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-80">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Coming Soon</h2>
              <button 
                onClick={() => setShowComingSoon(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">This feature is not yet available. Stay tuned for updates!</p>
            <button
              onClick={() => setShowComingSoon(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
