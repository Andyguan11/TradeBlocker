'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, MoreVertical, Plus, Shield, X } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import { Poppins } from 'next/font/google'

const poppins = Poppins({ 
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
})

interface App {
  name: string;
  domain: string;
  description: string;
  active: boolean;
  logo: string;
  accountSize?: number;
}

const apps: App[] = [
  {
    name: "TradingView",
    domain: "tradingview.com",
    description: "",
    active: true,
    logo: "/tradingview.png",
    accountSize: 10000  // Example account size
  }
]

export function ConnectedWallets() {
  const [filter, setFilter] = useState('all')
  const [appStates, setAppStates] = useState(apps.map(app => app.active))
  const [isAddHovered, setIsAddHovered] = useState(false)
  const [showBlockPopup, setShowBlockPopup] = useState(false)
  const [showSettingsPopup, setShowSettingsPopup] = useState(false)
  const [lossLimit, setLossLimit] = useState('')
  const [profitLimit, setProfitLimit] = useState('')
  const [limitType, setLimitType] = useState<'percentage' | 'value'>('percentage')

  const handleSwitchChange = (index: number) => {
    setAppStates(prevStates => {
      const newStates = [...prevStates]
      newStates[index] = !newStates[index]
      return newStates
    })
  }

  const handleSave = () => {
    // Add save logic here
    console.log('Saving:', { lossLimit, profitLimit })
    setShowSettingsPopup(false)
  }

  const handleDisconnect = () => {
    // Add disconnect logic here
    console.log('Disconnecting')
    setShowSettingsPopup(false)
  }

  return (
    <div className={`w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden ${poppins.className}`}>
      {/* Block now banner */}
      <div 
        className="bg-gradient-to-b from-red-50 to-white p-3 flex items-center justify-center cursor-pointer"
        onClick={() => setShowBlockPopup(true)}
      >
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-red-500" />
          <span className="text-sm font-medium text-red-700">Block All Now</span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Connected Brokerages & Triggers</h1>
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
                    {app.accountSize && (
                      <p className="text-sm text-gray-500">Account size: ${app.accountSize.toLocaleString()}</p>
                    )}
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
                    <button 
                      className="p-1 rounded-full hover:bg-gray-100"
                      onClick={() => setShowSettingsPopup(true)}
                    >
                      <MoreVertical className="text-gray-400 w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Settings Popup */}
        {showSettingsPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">TradingView Settings</h2>
                <button 
                  onClick={() => setShowSettingsPopup(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limit Type
                  </label>
                  <select
                    value={limitType}
                    onChange={(e) => setLimitType(e.target.value as 'percentage' | 'value')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="value">Value ($)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="lossLimit" className="block text-sm font-medium text-gray-700 mb-1">
                    Loss Limit
                  </label>
                  <input
                    type="number"
                    id="lossLimit"
                    value={lossLimit}
                    onChange={(e) => setLossLimit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Enter loss limit ${limitType === 'percentage' ? '%' : '$'}`}
                  />
                </div>
                <div>
                  <label htmlFor="profitLimit" className="block text-sm font-medium text-gray-700 mb-1">
                    Profit Limit
                  </label>
                  <input
                    type="number"
                    id="profitLimit"
                    value={profitLimit}
                    onChange={(e) => setProfitLimit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Enter profit limit ${limitType === 'percentage' ? '%' : '$'}`}
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Block Popup */}
        {showBlockPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <h2 className="text-xl font-semibold mb-4">Confirm Block</h2>
              <p className="mb-4">Are you sure you want to activate the block?</p>
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => setShowBlockPopup(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    // Add your block activation logic here
                    setShowBlockPopup(false)
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
                >
                  Yes, Activate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}