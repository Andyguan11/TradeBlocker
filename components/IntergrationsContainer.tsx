/* eslint-disable react/no-unescaped-entities */
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { MoreVertical, Plus, Shield, X } from 'lucide-react'
import { Poppins } from 'next/font/google'
import { createClient } from '@supabase/supabase-js'
import { Switch } from '@radix-ui/react-switch';
import { Checkbox } from "@/components/ui/checkbox"
import Image from 'next/image'
import InstalledApps from './InstalledApps';

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

interface Platform {
  id: string;
  name: string;
  // Add other properties as needed
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
  const [blockState, setBlockState] = useState<'active' | 'inactive'>('inactive');
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
  const [error, setError] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        // Simulate API call to fetch user's platforms
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Add TradingView as a default platform
        const defaultPlatforms: Platform[] = [
          { id: 'tradingview', name: 'TradingView' },
        ];
        
        // Fetch other connected platforms from your API
        // const response = await fetch('/api/user-platforms');
        // const userPlatforms = await response.json();
        
        // Combine default and user platforms
        // setPlatforms([...defaultPlatforms, ...userPlatforms]);
        setPlatforms(defaultPlatforms);
      } catch (error) {
        console.error('Error fetching platforms:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlatforms();
  }, []);

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
      setBlockState(data.block_state || 'inactive');
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

  useEffect(() => {
    const fetchUserAndSettings = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchUserSettings(user.id);
      } else {
        console.error('No user found');
      }
      setIsLoading(false);
    };

    fetchUserAndSettings();
  }, [fetchUserSettings]);

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

  useEffect(() => {
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
    const newIntegrations = selectedPlatforms.map(platformName => {
      const platform = availablePlatforms.find(p => p.name === platformName);
      return {
        name: platform!.name,
        description: "New integration",
        logo: platform!.logo,
        connected: true
      };
    });

    const updatedConnectedPlatforms = [...connectedPlatforms, ...selectedPlatforms];

    // Update the database
    const { error } = await supabase
      .from('user_settings')
      .update({ connected_platforms: updatedConnectedPlatforms })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating connected platforms:', error);
    } else {
      setConnectedPlatforms(updatedConnectedPlatforms);
      setIntegrations(prev => [...prev, ...newIntegrations]);
      handleCloseAddIntegrationModal();
    }
  };

  const handleRemovePlatform = async (platformName: string) => {
    if (platformName === "TradingView") {
      console.log("TradingView cannot be removed as it's a default integration.");
      return;
    }

    const updatedConnectedPlatforms = connectedPlatforms.filter(name => name !== platformName);
    
    // Update the database
    const { error } = await supabase
      .from('user_settings')
      .update({ connected_platforms: updatedConnectedPlatforms })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating connected platforms:', error);
    } else {
      setConnectedPlatforms(updatedConnectedPlatforms);
      setIntegrations(prev => prev.filter(integration => integration.name !== platformName));
    }
  };

  const indexOfLastIntegration = currentPage * integrationsPerPage;
  const indexOfFirstIntegration = indexOfLastIntegration - integrationsPerPage;
  const currentIntegrations = integrations.slice(indexOfFirstIntegration, indexOfLastIntegration);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className={`w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${poppins.className}`}>
      <div className="integrations-container">
        <h2>Connected Platforms</h2>
      {isLoading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <InstalledApps platforms={platforms} />
            )}
          </div>
    </div>
  )
}

export default IntergrationsContainer;
