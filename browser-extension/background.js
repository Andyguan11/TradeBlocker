const SUPABASE_URL = 'https://piyqyopfzdrtnhjaapvu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpeXF5b3BmemRydG5oamFhcHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcyOTkxMzQsImV4cCI6MjA0Mjg3NTEzNH0.6rxtaB3yu9jM_9Si6E265D82mXUSPfB_iKXmdhkMM7c';
const CHECK_INTERVAL = 30000; // Check every 30 seconds

async function checkBlockStatus(userId) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${userId}&select=block_state`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const data = await response.json();
    return data.length > 0 && data[0].block_state === 'active';
  } catch (error) {
    console.error('Error checking block status:', error);
    return false;
  }
}

async function updateBlockState(userId) {
  const isBlocked = await checkBlockStatus(userId);
  chrome.tabs.query({url: '*://*.tradingview.com/*'}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { action: "updateBlockState", isBlocked });
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "setUserId") {
    chrome.storage.sync.set({ userId: request.userId }, () => {
      updateBlockState(request.userId);
      sendResponse({ success: true });
    });
    return true;
  }
});

chrome.alarms.create("checkBlockStatus", { periodInMinutes: 0.5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkBlockStatus") {
    chrome.storage.sync.get(['userId'], ({ userId }) => {
      if (userId) {
        updateBlockState(userId);
      }
    });
  }
});