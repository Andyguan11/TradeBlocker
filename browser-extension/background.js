const SUPABASE_URL = 'https://piyqyopfzdrtnhjaapvu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpeXF5b3BmemRydG5oamFhcHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcyOTkxMzQsImV4cCI6MjA0Mjg3NTEzNH0.6rxtaB3yu9jM_9Si6E265D82mXUSPfB_iKXmdhkMM7c';

let isBlocked = false;
let userId = null;
let blockEndTime = null;
let connectedPlatforms = ["TradingView"]; // Default platform

// Function to check block status from the database
async function checkBlockStatus() {
  if (!userId) {
    console.log('No user ID set, skipping block status check');
    return;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${userId}&select=block_state,block_end_time,connected_platforms`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const data = await response.json();
    
    if (data.length > 0) {
      const { block_state, block_end_time, connected_platforms } = data[0];
      const now = new Date();
      const endTime = new Date(block_end_time);

      isBlocked = block_state === 'active' && now < endTime;
      blockEndTime = isBlocked ? block_end_time : null;
      connectedPlatforms = connected_platforms || ["TradingView"];

      console.log('Block status updated from database:', isBlocked);
      updateAllTabs();
    }
  } catch (error) {
    console.error('Error checking block status:', error);
  }
}

// Function to update all tabs with the current block state
function updateAllTabs() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { action: "updateBlockState", isBlocked: isBlocked }, (response) => {
        if (chrome.runtime.lastError) {
          console.log(`Could not send message to tab ${tab.id}: ${chrome.runtime.lastError.message}`);
        }
      });
    });
  });
}

// Check block status when the extension starts
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['userId'], (result) => {
    if (result.userId) {
      userId = result.userId;
      checkBlockStatus();
    }
  });
});

// Check block status when a new tab is created
chrome.tabs.onCreated.addListener(() => {
  checkBlockStatus();
});

// Check block status when a tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    checkBlockStatus();
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getInitialBlockState") {
    checkBlockStatus().then(() => {
      sendResponse({ isBlocked: isBlocked, isSetup: !!userId });
    });
    return true; // Indicates that the response is sent asynchronously
  } else if (request.action === "updateBlockState") {
    isBlocked = request.isBlocked;
    blockEndTime = request.endTime;
    
    if (isBlocked && userId) {
      const blockDuration = Math.round((new Date(blockEndTime) - new Date()) / (1000 * 60)); // Duration in minutes
      updateAverageBlockDuration(userId, blockDuration);
    }
    
    updateAllTabs();
    sendResponse({ success: true });
  } else if (request.action === "setUserId") {
    userId = request.userId;
    checkBlockStatus();
    sendResponse({ success: true });
  }
});

// Periodically check block status
setInterval(checkBlockStatus, 60000); // Check every minute

// Initial check when the background script loads
chrome.storage.sync.get(['userId'], (result) => {
  if (result.userId) {
    userId = result.userId;
    checkBlockStatus();
  }
});

// Add this function to calculate average block duration
async function updateAverageBlockDuration(userId, newDuration) {
  try {
    const { data, error } = await fetch(`${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${userId}&select=total_blocks,average_block_duration`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }).then(res => res.json());

    if (error) throw error;

    const { total_blocks, average_block_duration } = data[0];
    const newTotalBlocks = total_blocks + 1;
    const newAverageDuration = Math.round((average_block_duration * total_blocks + newDuration) / newTotalBlocks);

    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        total_blocks: newTotalBlocks,
        average_block_duration: newAverageDuration
      })
    });

    if (!updateResponse.ok) throw new Error('Failed to update average block duration');

    console.log('Updated average block duration:', newAverageDuration);
  } catch (error) {
    console.error('Error updating average block duration:', error);
  }
}
