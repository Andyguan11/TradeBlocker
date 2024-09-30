'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, MoreVertical, Plus } from 'lucide-react'
import { Switch } from "@/components/ui/switch"

interface App {
  name: string;
  domain: string;
  description: string;
  active: boolean;
  logo: string;
}

const apps: App[] = [
  {
    name: "Gopay",
    domain: "Gojek.com",
    description: "Secure, seamless transactions on the go.",
    active: true,
    logo: "/placeholder.svg?height=40&width=40"
  }
]

export function ConnectedWallets() {
  const [filter, setFilter] = useState('all')
  const [appStates, setAppStates] = useState(apps.map(app => app.active))
  const [isAddHovered, setIsAddHovered] = useState(false)

  const handleSwitchChange = (index: number) => {
    setAppStates(prevStates => {
      const newStates = [...prevStates]
      newStates[index] = !newStates[index]
      return newStates
    })
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Connected Wallets and Apps</h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="p-2 rounded-lg hover:bg-gray-100 border border-gray-300">
            <SlidersHorizontal className="text-gray-600 w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => setFilter('all')}
          >
            View all
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium ${filter === 'active' ? 'bg-gray-100 text-gray-600' : 'bg-transparent text-gray-600'}`}
            onClick={() => setFilter('active')}
          >
            Actived
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium ${filter === 'inactive' ? 'bg-gray-100 text-gray-600' : 'bg-transparent text-gray-600'}`}
            onClick={() => setFilter('inactive')}
          >
            Inactive
          </button>
        </div>
        <button 
          className={`p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 flex items-center ${isAddHovered ? 'px-4' : ''}`}
          onMouseEnter={() => setIsAddHovered(true)}
          onMouseLeave={() => setIsAddHovered(false)}
        >
          <Plus className="w-5 h-5" />
          {isAddHovered && (
            <span className="ml-2 whitespace-nowrap overflow-hidden transition-all duration-300" style={{ maxWidth: isAddHovered ? '100px' : '0' }}>
              Integration
            </span>
          )}
        </button>
      </div>
      <div className="space-y-4">
        {apps
          .filter(app => filter === 'all' || (filter === 'active' && app.active) || (filter === 'inactive' && !app.active))
          .map((app, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
              <div className="flex items-center space-x-4">
                <img src={app.logo} alt={`${app.name} logo`} className="w-12 h-12 rounded-xl" />
                <div>
                  <h2 className="font-semibold text-gray-800">{app.name}</h2>
                  <p className="text-sm text-gray-500">{app.domain}</p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                      appStates[index] ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    onClick={() => handleSwitchChange(index)}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                        appStates[index] ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    ></div>
                  </div>
                  <button className="p-1 rounded-full hover:bg-gray-100">
                    <MoreVertical className="text-gray-400 w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 max-w-md text-right">{app.description}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}