'use client'

import { Bell, Plus } from "lucide-react"
import Image from "next/image"

const HeaderNav = () => {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-white border-b shadow-sm">
      <div className="flex items-center">
        <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-full" />
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
          <Bell className="w-5 h-5 text-gray-600" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
          <span className="text-sm font-medium">YA</span>
        </div>
      </div>
    </header>
  )
}

export default HeaderNav;