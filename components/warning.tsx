'use client'

import { X } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
);

export function DashboardComponent() {
  const [isVisible, setIsVisible] = useState(true)
  const [userIdDisplay, setUserIdDisplay] = useState<string | null>(null)
  const [isExtensionConnected, setIsExtensionConnected] = useState(false)

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserIdDisplay(user.id);
      }
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    const checkExtensionConnection = async () => {
      if (!userIdDisplay) return;

      try {
        const response = await fetch(`/api/check-extension-connection?userId=${userIdDisplay}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsExtensionConnected(data.isConnected);
        } else {
          console.error("Failed to check extension connection");
          setIsExtensionConnected(false);
        }
      } catch (error) {
        console.error("Error checking extension connection:", error);
        setIsExtensionConnected(false);
      }
    };

    if (userIdDisplay) {
      checkExtensionConnection();
    }
  }, [userIdDisplay]);

  if (!isVisible) return null

  return (
    <div className="w-full max-w-xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-4 relative dark:text-white">
        <button
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          onClick={() => setIsVisible(false)}
          aria-label="Close"
        >
          <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg
              className="w-8 h-8 text-yellow-400"
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
            <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
              Browser Extension Setup
            </h2>
            {userIdDisplay && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Your User ID: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{userIdDisplay}</span>
                </p>
                <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-300 mt-2 space-y-1">
                  <li>Install our browser extension from the Chrome Web Store (link coming soon).</li>
                  <li>Click on the extension icon and enter your User ID.</li>
                  <li>The extension will now automatically apply your block settings.</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
