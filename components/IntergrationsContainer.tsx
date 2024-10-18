/// <reference types="chrome"/>
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { MoreVertical, Plus, Shield, X } from 'lucide-react'
import { Poppins } from 'next/font/google'
import { createClient } from '@supabase/supabase-js'
import { Switch } from '@radix-ui/react-switch';
import { Checkbox } from "@/components/ui/checkbox"
import Image from 'next/image'

const poppins = Poppins({ 
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
})

// Update the App interface
interface App {
  name: string;
  description: string;
  logo: string;
  accountSize?: number;
  connected: boolean;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
);

// Add this new interface
interface AvailablePlatform {
  description: string;
  name: string;
  logo: string;
  connected: boolean;
}

const IntergrationsContainer: React.FC = () => {
  const [filter, setFilter] = useState('all')
  const [isAddHovered, setIsAddHovered] = useState(false)
  const [showBlockPopup, setShowBlockPopup] = useState(false)
  const [showSettingsPopup, setShowSettingsPopup] = useState(false)
  const [lossLimit, setLossLimit] = useState('')
  const [profitLimit, setProfitLimit] = useState('')
  const [limitType, setLimitType] = useState<'percentage' | 'value'>('percentage')
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [showComingSoonIntegration, setShowComingSoonIntegration] = useState(false)
  const [blockDuration, setBlockDuration] = useState({ days: '', hours: '', minutes: '' });
  const [isUnlockable, setIsUnlockable] = useState(false);
  const [showBlockConfirmation, setShowBlockConfirmation] = useState(false);
  const [activeBlock, setActiveBlock] = useState<null | {
    end_time: string;
    is_unlockable: boolean;
  }>(null);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // Add these new state variables
  const [showAddIntegrationModal, setShowAddIntegrationModal] = useState(false);
  const [availablePlatforms] = useState<AvailablePlatform[]>([
    {
      name: "TradingView", logo: "/tradingview.png", connected: true,
      description: "Real-time market data and analysis"
    },
    {
      name: "Tradovate", logo: "/tradovate.png", connected: false,
      description: "Futures trading platform"
    },
    {
      name: "NinjaTrader", logo: "/Ninjatrader.png", connected: false,
      description: "Advanced trading platform"
    },
    {
      name: "Metatrader5", logo: "/mt5.png", connected: false,
      description: "Multi-asset trading platform"
    },
    {
      name: "Metatrader4", logo: "/mt4.png", connected: false,
      description: "Forex and CFD trading platform"
    },
  ]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [integrations, setIntegrations] = useState<App[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const integrationsPerPage = 5;
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>(["TradingView"]);
  const [isLoading, setIsLoading] = useState(true);

  const [localBlockState, setLocalBlockState] = useState<'active' | 'inactive'>('inactive');

  // Add this function near the top of your component
  const notifyExtension = (isBlocked: boolean) => {
    try {
      if (typeof window !== 'undefined' && 'chrome' in window && chrome.runtime) {
        chrome.runtime.sendMessage({action: "updateBlockState", isBlocked: isBlocked});
      }
    } catch (error) {
      console.error('Error notifying extension:', error);
    }
  };

  const fetchUserSettings = useCallback(async (userId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_settings')
      .select('block_state, block_end_time, is_unlockable, total_blocks, connected_platforms')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('No user settings found, creating new settings');
        await createUserSettings(userId);
      } else {
        console.error('Error fetching user settings:', error);
      }
      setIsLoading(false);
      return;
    }

    if (data) {
      console.log('Fetched user settings:', data);
      setTotalBlocks(data.total_blocks || 0);
      setLocalBlockState(data.block_state || 'inactive');
      // Ensure TradingView is always included in connected platforms
      const platforms = data.connected_platforms || [];
      if (!platforms.includes("TradingView")) {
        platforms.push("TradingView");
      }
      setConnectedPlatforms(platforms);
      
      // Update integrations based on connected platforms
      const updatedIntegrations = platforms.map((platformName: string) => {
        const platform = availablePlatforms.find(p => p.name === platformName);
        return {
          name: platformName,
          description: platform ? platform.description : "Connected platform",
          logo: platform ? platform.logo : "/default-logo.png",
          connected: true
        };
      });
      setIntegrations(updatedIntegrations);

      const now = new Date();
      const endTime = new Date(data.block_end_time);
      if (endTime > now && data.block_state === 'active') {
        setActiveBlock({
          end_time: data.block_end_time,
          is_unlockable: data.is_unlockable
        });
        updateBlockDuration(endTime);
        console.log('Block is active, end time:', endTime);
      } else {
        setActiveBlock(null);
        setBlockDuration({ days: '', hours: '', minutes: '' });
        console.log('Block is inactive');
      }
    }
    setIsLoading(false);
  }, [availablePlatforms]);  // Add availablePlatforms to the dependency array

  const fetchConnectedPlatforms = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('connected_platforms')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching connected platforms:', error);
      return [];
    }

    return data?.connected_platforms || [];
  }, []);

  const updateConnectedPlatforms = useCallback(async (userId: string, platforms: string[]) => {
    const { error } = await supabase
      .from('user_settings')
      .update({ connected_platforms: platforms })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating connected platforms:', error);
    }
  }, []);

  useEffect(() => {
    const initializeUserSettings = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        let platforms = await fetchConnectedPlatforms(user.id);
        
        if (platforms.length === 0) {
          // If no platforms are connected, add TradingView as default
          platforms = ["TradingView"];
          await updateConnectedPlatforms(user.id, platforms);
        }

        setConnectedPlatforms(platforms);
        const updatedIntegrations = platforms.map((platformName: string) => {
          const platform = availablePlatforms.find(p => p.name === platformName);
          return {
            name: platformName,
            description: platform ? platform.description : "Connected platform",
            logo: platform ? platform.logo : "/default-logo.png",
            connected: true
          };
        });
        setIntegrations(updatedIntegrations);
        await fetchUserSettings(user.id);
      }
      setIsLoading(false);
    };

    initializeUserSettings();
  }, [fetchConnectedPlatforms, updateConnectedPlatforms, fetchUserSettings, availablePlatforms]);

  const createUserSettings = async (userId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_settings')
      .insert({ 
        user_id: userId, 
        total_blocks: 0, 
        connected_platforms: ["TradingView"]
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user settings:', error);
    } else {
      console.log('Created user settings:', data);
      setConnectedPlatforms(["TradingView"]);
    }
    setIsLoading(false);
  };

  const updateBlockDuration = (endTime: Date) => {
    const remainingTime = endTime.getTime() - new Date().getTime();
    setBlockDuration({
      days: Math.floor(remainingTime / (1000 * 60 * 60 * 24)).toString(),
      hours: Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString(),
      minutes: Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60)).toString(),
    });
  };

  const isDurationSet = () => {
    return (
      (blockDuration.days && parseInt(blockDuration.days) > 0) ||
      (blockDuration.hours && parseInt(blockDuration.hours) > 0) ||
      (blockDuration.minutes && parseInt(blockDuration.minutes) > 0)
    );
  };

  const handleBlockActivation = async () => {
    if (!isDurationSet()) {
      alert("Please set a duration for the block.");
      return;
    }

    if (!userId) {
      console.error('No user logged in');
      return;
    }

    const endTime = new Date();
    endTime.setDate(endTime.getDate() + (parseInt(blockDuration.days) || 0));
    endTime.setHours(endTime.getHours() + (parseInt(blockDuration.hours) || 0));
    endTime.setMinutes(endTime.getMinutes() + (parseInt(blockDuration.minutes) || 0));

    // Optimistically update local state
    setLocalBlockState('active');
    setActiveBlock({
      end_time: endTime.toISOString(),
      is_unlockable: isUnlockable,
    });
    setTotalBlocks(prevTotalBlocks => prevTotalBlocks + 1);
    updateBlockDuration(endTime);
    setShowBlockConfirmation(false);

    try {
      // Update Supabase
      const { error } = await supabase
        .from('user_settings')
        .update({
          block_state: 'active',
          block_end_time: endTime.toISOString(),
          is_unlockable: isUnlockable,
          total_blocks: totalBlocks + 1
        })
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      console.log('Block activated, new state:', 'active', 'end time:', endTime);
      notifyExtension(true);  // Notify the extension
    } catch (error) {
      console.error('Error activating block:', error);
      // Revert local state if server update fails
      setLocalBlockState('inactive');
      setActiveBlock(null);
      setTotalBlocks(prevTotalBlocks => prevTotalBlocks - 1);
      setBlockDuration({ days: '', hours: '', minutes: '' });
    }
  };

  const handleUnblock = async () => {
    if (!userId || !activeBlock) return;

    // Optimistically update local state
    setLocalBlockState('inactive');
    setActiveBlock(null);
    setBlockDuration({ days: '', hours: '', minutes: '' });

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ 
          block_state: 'inactive',
          block_end_time: new Date().toISOString() 
        })
        .eq('user_id', userId);

      if (error) throw error;

      console.log('Block deactivated');
      notifyExtension(false);  // Notify the extension
    } catch (error) {
      console.error('Error removing block:', error);
      // Revert local state if server update fails
      setLocalBlockState('active');
      setActiveBlock(activeBlock);
      updateBlockDuration(new Date(activeBlock.end_time));
    }
  };

  const formatBlockDuration = (duration: { days: string, hours: string, minutes: string }) => {
    const parts = [];
    if (duration.days && parseInt(duration.days) > 0) {
      parts.push(`${duration.days}d`);
    }
    if (duration.hours && parseInt(duration.hours) > 0) {
      parts.push(`${duration.hours}h`);
    }
    if (duration.minutes && parseInt(duration.minutes) > 0) {
      parts.push(`${duration.minutes}m`);
    }
    return parts.length > 0 ? parts.join(' ') : 'Less than a minute';
  };

  useEffect(() => {
    const checkBlockStatus = async () => {
      if (userId && activeBlock) {
        const now = new Date();
        const endTime = new Date(activeBlock.end_time);
        if (endTime <= now) {
          // Block has expired
          setActiveBlock(null);
          setLocalBlockState('inactive');
          setBlockDuration({ days: '', hours: '', minutes: '' });
          console.log('Block expired, new state:', 'inactive');

          // Update the database
          const { error } = await supabase
            .from('user_settings')
            .update({ 
              block_state: 'inactive',
              block_end_time: now.toISOString() 
            })
            .eq('user_id', userId);

          if (error) {
            console.error('Error updating block state in database:', error);
          }
          notifyExtension(false);
        } else {
          // Block is still active
          setLocalBlockState('active');
          updateBlockDuration(endTime);
        }
      }
    };

    const timer = setInterval(checkBlockStatus, 60000); // Check every minute

    return () => clearInterval(timer);
  }, [userId, activeBlock]);

  const handleAddIntegration = () => {
    setShowAddIntegrationModal(true);
  };

  const handleCloseAddIntegrationModal = () => {
    setShowAddIntegrationModal(false);
    setSelectedPlatforms([]);
  };

  const handleSelectPlatform = (platformName: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformName) 
        ? prev.filter(name => name !== platformName)
        : [...prev, platformName]
    );
  };

  const handleConfirmAddIntegrations = async () => {
    if (!userId) return;

    const newIntegrations = selectedPlatforms.map(platformName => {
      const platform = availablePlatforms.find(p => p.name === platformName);
      return {
        name: platform!.name,
        description: platform!.description,
        logo: platform!.logo,
        connected: true
      };
    });

    const updatedConnectedPlatforms = [...connectedPlatforms, ...selectedPlatforms];

    await updateConnectedPlatforms(userId, updatedConnectedPlatforms);
    setConnectedPlatforms(updatedConnectedPlatforms);
    setIntegrations(prev => [...prev, ...newIntegrations]);
    handleCloseAddIntegrationModal();
  };

  const handleRemovePlatform = async (platformName: string) => {
    if (!userId || platformName === "TradingView") {
      console.log("TradingView cannot be removed as it's a default integration.");
      return;
    }

    const updatedConnectedPlatforms = connectedPlatforms.filter(name => name !== platformName);
    
    await updateConnectedPlatforms(userId, updatedConnectedPlatforms);
    setConnectedPlatforms(updatedConnectedPlatforms);
    setIntegrations(prev => prev.filter(integration => integration.name !== platformName));
  };

  const indexOfLastIntegration = currentPage * integrationsPerPage;
  const indexOfFirstIntegration = indexOfLastIntegration - integrationsPerPage;
  const currentIntegrations = integrations.slice(indexOfFirstIntegration, indexOfLastIntegration);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className={`w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${poppins.className}`}>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      ) : (
        <>
          {/* Block now banner */}
          <div className="bg-gradient-to-b from-red-50 to-white dark:from-red-900 dark:to-gray-800 p-3 flex flex-col items-center justify-center">
            {localBlockState === 'inactive' ? (
              <div 
                className="flex items-center space-x-2 cursor-pointer mb-2"
                onClick={() => setShowBlockConfirmation(true)}
              >
                <Shield className="w-5 h-5 text-red-500 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Block All Now</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Block active for: {formatBlockDuration(blockDuration)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Total blocks: {totalBlocks}
                </div>
                {activeBlock?.is_unlockable && (
                  <button
                    onClick={handleUnblock}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 mt-2"
                  >
                    Unblock
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="p-6 dark:text-white">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Brokerages & Triggers</h1>
              {/* Remove the search bar and filter icon */}
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
                  className={`px-4 py-2 rounded-full text-sm font-medium ${filter === 'connected' ? 'bg-gray-100 text-gray-600' : 'bg-transparent text-gray-600'}`}
                  onClick={() => setFilter('connected')}
                >
                  Connected
                </button>
              </div>
              <button 
                className={`p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 flex items-center ${isAddHovered ? 'px-4' : ''}`}
                onMouseEnter={() => setIsAddHovered(true)}
                onMouseLeave={() => setIsAddHovered(false)}
                onClick={handleAddIntegration}
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
              {currentIntegrations
                .filter(app => filter === 'all' || (filter === 'connected' && app.connected))
                .map((app, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-4">
                      <Image src={app.logo} alt={`${app.name} logo`} width={48} height={48} className="rounded-xl" />
                      <div>
                        <h2 className="font-semibold text-gray-800 dark:text-gray-200">{app.name}</h2>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => setShowSettingsPopup(true)}
                      >
                        <MoreVertical className="text-gray-400 w-5 h-5" />
                      </button>
                      {app.name !== "TradingView" && (
                        <button 
                          className="px-2 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => handleRemovePlatform(app.name)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Pagination */}
            {integrations.length > integrationsPerPage && (
              <div className="flex justify-center mt-4">
                {Array.from({ length: Math.ceil(integrations.length / integrationsPerPage) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => paginate(i + 1)}
                    className={`mx-1 px-3 py-1 rounded ${
                      currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Settings Popup */}
            {showSettingsPopup && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">TradingView Settings</h2>
                    <button 
                      onClick={() => setShowSettingsPopup(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Limit Type
                      </label>
                      <select
                        value={limitType}
                        onChange={(e) => setLimitType(e.target.value as 'percentage' | 'value')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="value">Value ($)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="lossLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Loss Limit
                      </label>
                      <input
                        type="number"
                        id="lossLimit"
                        value={lossLimit}
                        onChange={(e) => setLossLimit(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={`Enter loss limit ${limitType === 'percentage' ? '%' : '$'}`}
                      />
                    </div>
                    <div>
                      <label htmlFor="profitLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Profit Limit
                      </label>
                      <input
                        type="number"
                        id="profitLimit"
                        value={profitLimit}
                        onChange={(e) => setProfitLimit(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={`Enter profit limit ${limitType === 'percentage' ? '%' : '$'}`}
                      />
                    </div>
                    <button
                      className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200 cursor-not-allowed"
                      disabled
                    >
                      Coming Soon
                    </button>
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
                  <p className="text-gray-600 mb-4">The "Block All Now" feature is not yet available. Stay tuned for updates!</p>
                  <button
                    onClick={() => setShowComingSoon(false)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                  >
                    Got it
                  </button>
                </div>
              </div>
            )}

            {/* Coming Soon Integration Popup */}
            {showComingSoonIntegration && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-80">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Coming Soon</h2>
                    <button 
                      onClick={() => setShowComingSoonIntegration(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">The ability to add new integrations is not yet available. Stay tuned for updates!</p>
                  <button
                    onClick={() => setShowComingSoonIntegration(false)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                  >
                    Got it
                  </button>
                </div>
              </div>
            )}

            {/* Block Configuration Popup */}
            {showBlockConfirmation && localBlockState === 'inactive' && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Configure Block</h2>
                  <div className="space-y-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Block Duration
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          value={blockDuration.days}
                          onChange={(e) => setBlockDuration({...blockDuration, days: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Days"
                          min="0"
                        />
                        <input
                          type="number"
                          value={blockDuration.hours}
                          onChange={(e) => setBlockDuration({...blockDuration, hours: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Hours"
                          min="0"
                          max="23"
                        />
                        <input
                          type="number"
                          value={blockDuration.minutes}
                          onChange={(e) => setBlockDuration({...blockDuration, minutes: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Minutes"
                          min="0"
                          max="59"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={isUnlockable}
                          onCheckedChange={setIsUnlockable}
                          className={`${
                            isUnlockable ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
                        >
                          <span
                            className={`${
                              isUnlockable ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Unlockable Block
                        </label>
                      </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {isUnlockable 
                            ? &quot;Unlockable: You can remove the block before the set duration ends.&quot;
                            : &quot;Lockable: Once set, the block cannot be removed until the duration ends.&quot;}
                        </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Platforms to be blocked:
                      </label>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                        {connectedPlatforms.map((platform) => (
                          <li key={platform}>{platform}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={() => setShowBlockConfirmation(false)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleBlockActivation}
                      className={`px-4 py-2 text-white rounded transition-colors duration-200 ${
                        isDurationSet()
                          ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
                          : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                      }`}
                      disabled={!isDurationSet()}
                    >
                      Activate Block
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add Integration Modal */}
            {showAddIntegrationModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96 max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Integrations</h2>
                    <button 
                      onClick={handleCloseAddIntegrationModal}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4 mb-4">
                    {availablePlatforms.map(platform => (
                      <div 
                        key={platform.name}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Checkbox
                          id={`checkbox-${platform.name}`}
                          checked={selectedPlatforms.includes(platform.name) || connectedPlatforms.includes(platform.name)}
                          onCheckedChange={() => handleSelectPlatform(platform.name)}
                          disabled={connectedPlatforms.includes(platform.name)}
                        />
                        <Image src={platform.logo} alt={`${platform.name} logo`} width={32} height={32} />
                        <label
                          htmlFor={`checkbox-${platform.name}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {platform.name}
                        </label>
                        {connectedPlatforms.includes(platform.name) && (
                          <span className="text-green-500 text-sm">Connected</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleConfirmAddIntegrations}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                    disabled={selectedPlatforms.length === 0}
                  >
                    Add Selected Integrations
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default IntergrationsContainer;