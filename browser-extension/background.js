const SUPABASE_URL = 'https://piyqyopfzdrtnhjaapvu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpeXF5b3BmemRydG5oamFhcHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcyOTkxMzQsImV4cCI6MjA0Mjg3NTEzNH0.6rxtaB3yu9jM_9Si6E265D82mXUSPfB_iKXmdhkMM7c';
const CHECK_INTERVAL = 3000; // Check every 3 seconds

let isBlocked = false;
let userId = null;
let isSetup = false;
let blockEndTime = null;
let blockedPlatforms = [];

async function checkBlockStatus(userId) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${userId}&select=block_state,block_end_time`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const data = await response.json();
    
    if (data.length > 0) {
      const { block_state, block_end_time } = data[0];
      const now = new Date();
      const endTime = new Date(block_end_time);

      if (block_state === 'active' && now > endTime) {
        // Block has expired, update the database
        await updateBlockState(userId, 'inactive');
        return false;
      }

      return block_state === 'active';
    }
    return false;
  } catch (error) {
    console.error('Error checking block status:', error);
    return false;
  }
}

async function checkSetupStatus() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['userId'], (result) => {
      isSetup = !!result.userId;
      resolve(isSetup);
    });
  });
}

async function updateBlockState(userId, newState) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ block_state: newState })
    });
    if (!response.ok) throw new Error('Failed to update block state');
  } catch (error) {
    console.error('Error updating block state:', error);
  }
}

async function updateExtensionConnectionStatus(userId, isConnected) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ extension_connected: isConnected })
    });
    if (!response.ok) throw new Error('Failed to update extension connection status');
  } catch (error) {
    console.error('Error updating extension connection status:', error);
  }
}

function broadcastBlockState() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { action: "updateBlockState", isBlocked });
    });
  });
}

async function initializeExtension() {
  const storedData = await chrome.storage.sync.get(['userId', 'isBlocked']);
  userId = storedData.userId || null;
  isBlocked = storedData.isBlocked || false;
  isSetup = !!userId;

  if (isSetup) {
    await updateBlockState();
    await updateExtensionConnectionStatus(userId, true);
  }
}

chrome.runtime.onInstalled.addListener(initializeExtension);
chrome.runtime.onStartup.addListener(initializeExtension);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "setUserId") {
    userId = request.userId;
    chrome.storage.sync.set({ userId }, async () => {
      isSetup = true;
      await updateBlockState();
      await updateExtensionConnectionStatus(userId, true);
      
      // Notify the web app that the extension is set up
      chrome.tabs.query({url: '*://your-webapp-domain.com/*'}, function(tabs) {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "extensionSetupComplete", userId: userId});
        }
      });
      
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === "getInitialBlockState") {
    sendResponse({ isBlocked, isSetup });
    return true;
  } else if (request.action === "checkSetupStatus") {
    sendResponse({ isSetup });
    return true;
  } else if (request.action === "updateBlockState") {
    isBlocked = request.isBlocked;
    blockEndTime = new Date(request.endTime);
    blockedPlatforms = request.blockedPlatforms;
    updateBlockStatus();
    
    // Notify all content scripts
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          action: "updateContentScript",
          isBlocked: isBlocked,
          blockedPlatforms: blockedPlatforms
        });
      });
    });

    sendResponse({success: true});
    return true;
  }
  return true;
});

setInterval(updateBlockState, CHECK_INTERVAL);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      (tab.url.includes('tradingview.com') || 
       tab.url.includes('ninjatrader.com') || 
       tab.url.includes('tradovate.com') || 
       tab.url.includes('metatrader.app'))) {
    chrome.tabs.sendMessage(tabId, { action: "updateBlockState", isBlocked });
  }
});

async function updateBlockState() {
  if (!await checkSetupStatus()) return;
  
  const newBlockState = await checkBlockStatus(userId);
  if (newBlockState !== isBlocked) {
    isBlocked = newBlockState;
    chrome.storage.sync.set({ isBlocked });
    broadcastBlockState();
  }

  // Update extension connection status in Supabase
  await updateExtensionConnectionStatus(userId, true);
}

function updateBlockStatus() {
  if (isBlocked && new Date() < blockEndTime) {
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1, 2, 3, 4, 5],
      addRules: blockedPlatforms.map((platform, index) => ({
        id: index + 1,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: `||${platform.toLowerCase()}.com`,
          resourceTypes: ["main_frame"]
        }
      }))
    });
  } else {
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1, 2, 3, 4, 5]
    });
    isBlocked = false;
  }
}
