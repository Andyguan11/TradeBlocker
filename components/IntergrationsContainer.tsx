'use client'

import React from 'react';
import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, MoreVertical, Plus, Shield, X } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import { Poppins } from 'next/font/google'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'

// Note: Ensure all dependencies are properly listed in package.json
// and that Netlify's dependency caching is configured correctly

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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
);

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
  const [blockState, setBlockState] = useState<'active' | 'inactive'>('inactive');
  const [isUnlockable, setIsUnlockable] = useState(false);
  const [showBlockConfirmation, setShowBlockConfirmation] = useState(false);
  const [activeBlock, setActiveBlock] = useState<null | {
    end_time: string;
    is_unlockable: boolean;
  }>(null);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    const fetchSettings = async () => {
      if (userId) {
        await fetchUserSettings(userId);
      }
    };
    fetchSettings();
  }, [userId]);

  const fetchUserSettings = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('block_state, block_end_time, is_unlockable, total_blocks')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('No user settings found, creating new settings');
        await createUserSettings(userId);
      } else {
        console.error('Error fetching user settings:', error);
      }
      return;
    }

    if (data) {
      console.log('Fetched user settings:', data);
      setTotalBlocks(data.total_blocks || 0);
      setBlockState(data.block_state || 'inactive');
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
  };

  const createUserSettings = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_settings')
      .insert({ user_id: userId, total_blocks: 0 })
      .select()
      .single();

    if (error) {
      console.error('Error creating user settings:', error);
    } else {
      console.log('Created user settings:', data);
    }
  };

  const updateBlockDuration = (endTime: Date) => {
    const remainingTime = endTime.getTime() - new Date().getTime();
    setBlockDuration({
      days: Math.floor(remainingTime / (1000 * 60 * 60 * 24)).toString(),
      hours: Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString(),
      minutes: Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60)).toString(),
    });
  };

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

  const handleBlockActivation = async () => {
    if (!userId) {
      console.error('No user logged in');
      return;
    }

    const endTime = new Date();
    endTime.setDate(endTime.getDate() + (parseInt(blockDuration.days) || 0));
    endTime.setHours(endTime.getHours() + (parseInt(blockDuration.hours) || 0));
    endTime.setMinutes(endTime.getMinutes() + (parseInt(blockDuration.minutes) || 0));

    // First, get the current total_blocks value
    const { data: currentData, error: fetchError } = await supabase
      .from('user_settings')
      .select('total_blocks')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching current total_blocks:', fetchError);
      return;
    }

    const currentTotalBlocks = currentData?.total_blocks || 0;
    const newTotalBlocks = currentTotalBlocks + 1;

    // Now update the user_settings with the new values
    const { data, error } = await supabase
      .from('user_settings')
      .update({
        block_state: 'active',
        block_end_time: endTime.toISOString(),
        is_unlockable: isUnlockable,
        total_blocks: newTotalBlocks
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error saving block data:', error);
    } else {
      console.log('Updated user settings:', data);
      setActiveBlock({
        end_time: endTime.toISOString(),
        is_unlockable: isUnlockable,
      });
      setBlockState('active');
      setTotalBlocks(newTotalBlocks);
      updateBlockDuration(endTime);
      setShowBlockConfirmation(false);
      console.log('Block activated, new state:', 'active', 'end time:', endTime);
    }
  };

  const handleUnblock = async () => {
    if (!userId || !activeBlock) return;

    const { error } = await supabase
      .from('user_settings')
      .update({ 
        block_state: 'inactive',
        block_end_time: new Date().toISOString() 
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing block:', error);
    } else {
      setActiveBlock(null);
      setBlockState('inactive');
      setBlockDuration({ days: '', hours: '', minutes: '' });
      console.log('Block deactivated');
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
    let timer: NodeJS.Timeout;
    const checkBlockStatus = async () => {
      if (userId && activeBlock) {
        const now = new Date();
        const endTime = new Date(activeBlock.end_time);
        if (endTime <= now) {
          // Block has expired
          setActiveBlock(null);
          setBlockState('inactive');
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
        } else {
          // Block is still active
          setBlockState('active');
          updateBlockDuration(endTime);
        }
      }
    };

    checkBlockStatus(); // Run immediately
    timer = setInterval(checkBlockStatus, 60000); // Check every minute

    return () => clearInterval(timer);
  }, [userId, activeBlock]);

  // Add this useEffect to log state changes
  useEffect(() => {
    console.log('Block state changed:', blockState);
  }, [blockState]);

  const handleBlockAllToggle = async () => {  // Add async here
    console.log('Activating block...');
    const { data, error: userError } = await supabase.auth.getUser();
    const user = data?.user;
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return;
    }

    console.log('User ID:', user.id);

    const { error } = await supabase
      .from('user_settings')
      .update({ 
        block_state: 'active',
        block_end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Set block for 24 hours
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating block state:', error);
    } else {
      setBlockState('active');
      console.log('Block state updated to active');
      try {
        const response = await fetch('/api/update-blocking-rules', { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user.id,
            blockState: 'active'
          })
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Update blocking rules response:', await response.text());
      } catch (error) {
        console.error('Error updating blocking rules:', error);
      }
    }

    const timer = setTimeout(() => {
      // ... existing code
    }, 500)
  };

  return (
    <div className={`w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden ${poppins.className}`}>
      {/* Block now banner */}
      <div className="bg-gradient-to-b from-red-50 to-white p-3 flex flex-col items-center justify-center">
        {blockState === 'inactive' ? (
          <div 
            className="flex items-center space-x-2 cursor-pointer mb-2"
            onClick={() => blockState === 'inactive' && setShowBlockConfirmation(true)}
          >
            <Shield className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-red-700">Block All Now</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="text-sm text-gray-600 mb-2">
              Block active for: {formatBlockDuration(blockDuration)}
            </div>
            <div className="text-sm text-gray-600">
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
            onClick={() => setShowComingSoonIntegration(true)}
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
                  <Image src={app.logo} alt={`${app.name} logo`} width={48} height={48} className="rounded-xl" />
                  <div>
                    <h2 className="font-semibold text-gray-800">{app.name}</h2>
                    <p className="text-sm text-gray-500">{app.domain}</p>
                    {app.accountSize && (
                      <p className="text-sm text-gray-500">Account size: ${app.accountSize.toLocaleString()}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    className="p-1 rounded-full hover:bg-gray-100"
                    onClick={() => setShowSettingsPopup(true)}
                  >
                    <MoreVertical className="text-gray-400 w-5 h-5" />
                  </button>
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
            <div className="bg-white p-6 rounded-lg shadow-xl w-80">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Coming Soon</h2>
                <button 
                  onClick={() => setShowComingSoonIntegration(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 mb-4">The ability to add new integrations is not yet available. Stay tuned for updates!</p>
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
        {showBlockConfirmation && blockState === 'inactive' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
              <h2 className="text-xl font-semibold mb-4">Configure Block</h2>
              <p className="text-sm text-gray-600 mb-4">You can only have one active block at a time.</p>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Block Duration
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={blockDuration.days}
                      onChange={(e) => setBlockDuration({...blockDuration, days: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Days"
                    />
                    <input
                      type="number"
                      value={blockDuration.hours}
                      onChange={(e) => setBlockDuration({...blockDuration, hours: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Hours"
                    />
                    <input
                      type="number"
                      value={blockDuration.minutes}
                      onChange={(e) => setBlockDuration({...blockDuration, minutes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Minutes"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isUnlockable}
                    onCheckedChange={setIsUnlockable}
                    className={`${
                      isUnlockable ? 'bg-blue-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        isUnlockable ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                  <label className="text-sm font-medium text-gray-700">
                    Unlockable Block
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => setShowBlockConfirmation(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBlockActivation}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
                >
                  Activate Block
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <p>This is a quote: &quot;Example&quot; and another &quot;quote&quot;</p>
    </div>
  )
}

export default IntergrationsContainer;