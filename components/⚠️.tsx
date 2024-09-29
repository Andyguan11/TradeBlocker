'use client'

import { X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/warnCard"
import { Button } from "@/components/ui/warnButton"
import Link from "next/link"
import { useState } from "react"

export function DashboardComponent() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <CardContent className="p-6 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={() => setIsVisible(false)}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <svg
              className="w-10 h-10 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-grow">
            <h2 className="text-lg font-semibold text-gray-900 leading-tight">
              Remember: Only one block can be active at a time.
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Lockable blocks cannot be cancelled once activated. Ensure your{" "}
              <Link href="/settings" className="text-blue-600 hover:underline">
                settings
              </Link>{" "}
              are correct before activating a block.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}