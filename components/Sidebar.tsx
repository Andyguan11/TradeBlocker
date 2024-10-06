'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/Sidebarbutton"
import { Card } from "@/components/ui/SidebarCard"
import { Avatar, AvatarFallback } from "@/components/ui/IntergrationsAvatar"
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
    { name: 'Notification', icon: (
      <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    )},
  ]

  return (
    <div className={`${isExpanded ? 'w-64' : 'w-20'} h-screen bg-gradient-to-b from-gray-100 to-white p-4 flex flex-col overflow-hidden relative transition-all duration-300 border-r border-gray-200`}>
      <div className="absolute inset-0 bg-white/40 backdrop-blur-xl -z-10" />
      
      {isExpanded ? (
        <>
          <Button 
            onClick={toggleSidebar} 
            className="absolute top-2 right-2 p-1 rounded-full bg-white/50 hover:bg-white/70 transition-colors z-10"
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

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Service: 3</span>
              <PencilIcon className="h-4 w-4 text-gray-400" />
            </div>
            <Card className="p-4 bg-white/50 backdrop-blur-sm shadow-lg">
              <div className="space-y-3">
                <Button variant="ghost" className="w-full justify-start hover:bg-white/50 transition-colors">
                  <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                  Jira software
                </Button>
                <Button variant="ghost" className="w-full justify-start hover:bg-white/50 transition-colors">
                  <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Slack
                </Button>
                <Button variant="ghost" className="w-full justify-start hover:bg-white/50 transition-colors">
                  <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                  Intercom
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-blue-500 hover:bg-white/50 transition-colors"
                  onClick={() => setShowComingSoon(true)}
                >
                  <PlusIcon className="h-5 w-5 mr-3" />
                  Add new plugin
                </Button>
              </div>
            </Card>
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
          <div className="bg-white p-6 rounded-lg shadow-xl w-80">
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