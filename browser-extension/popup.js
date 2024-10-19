document.addEventListener('DOMContentLoaded', function() {
  const userIdInput = document.getElementById('userId');
  const saveButton = document.getElementById('saveButton');
  const statusElement = document.getElementById('status');
  const unlockableSwitch = document.getElementById('unlockable');
  const unlockableDescription = document.getElementById('unlockableDescription');
  const blockConfigSection = document.getElementById('blockConfig');
  const activateBlockButton = document.getElementById('activateBlock');
  const daysInput = document.getElementById('days');
  const hoursInput = document.getElementById('hours');
  const minutesInput = document.getElementById('minutes');
  const platformList = document.getElementById('platformList');

  let userId = null;
  let connectedPlatforms = ["TradingView"];
  let blockDuration = { days: '', hours: '', minutes: '' };
  let isUnlockable = false;
  let totalBlocks = 0;

  // Initialize Supabase client
  const supabaseUrl = 'https://piyqyopfzdrtnhjaapvu.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpeXF5b3BmemRydG5oamFhcHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcyOTkxMzQsImV4cCI6MjA0Mjg3NTEzNH0.6rxtaB3yu9jM_9Si6E265D82mXUSPfB_iKXmdhkMM7c';
  const { createClient } = supabase;
  const supabaseClient = createClient(supabaseUrl, supabaseKey);

  // Check if user ID is already set
  chrome.storage.sync.get(['userId'], function(result) {
    if (result.userId) {
      userId = result.userId;
      userIdInput.value = userId;
      statusElement.textContent = 'User ID set. Blocking ready.';
      blockConfigSection.style.display = 'block';
      fetchUserSettings(userId);
    }
  });

  saveButton.addEventListener('click', function() {
    const newUserId = userIdInput.value.trim();
    if (newUserId) {
      chrome.storage.sync.set({userId: newUserId}, function() {
        userId = newUserId;
        statusElement.textContent = 'User ID set. Blocking ready.';
        blockConfigSection.style.display = 'block';
        createUserSettings(userId);
      });
    } else {
      statusElement.textContent = 'Please enter a valid User ID.';
      blockConfigSection.style.display = 'none';
    }
  });

  unlockableSwitch.addEventListener('change', updateUnlockableDescription);
  activateBlockButton.addEventListener('click', handleBlockActivation);
  daysInput.addEventListener('input', updateBlockDuration);
  hoursInput.addEventListener('input', updateBlockDuration);
  minutesInput.addEventListener('input', updateBlockDuration);

  function updateUnlockableDescription() {
    isUnlockable = unlockableSwitch.checked;
    unlockableDescription.textContent = isUnlockable
      ? "Unlockable: You can remove the block before the set duration ends."
      : "Lockable: Once set, the block cannot be removed until the duration ends.";
  }

  function updateBlockDuration() {
    blockDuration = {
      days: daysInput.value,
      hours: hoursInput.value,
      minutes: minutesInput.value
    };
    activateBlockButton.disabled = !isDurationSet();
  }

  function isDurationSet() {
    return (
      (blockDuration.days && parseInt(blockDuration.days) > 0) ||
      (blockDuration.hours && parseInt(blockDuration.hours) > 0) ||
      (blockDuration.minutes && parseInt(blockDuration.minutes) > 0)
    );
  }

  function updateUIBasedOnBlockState(isBlocked, isUnlockable) {
    console.log('Updating UI - isBlocked:', isBlocked, 'isUnlockable:', isUnlockable);
    if (isBlocked) {
      saveButton.disabled = true;
      saveButton.classList.add('opacity-50', 'cursor-not-allowed');
      userIdInput.disabled = true;
      blockConfigSection.style.display = 'none';
      
      const existingUnblockButton = document.getElementById('unblockButton');
      if (existingUnblockButton) {
        existingUnblockButton.remove();
      }
      
      if (isUnlockable) {
        console.log('Creating unblock button');
        const unblockButton = document.createElement('button');
        unblockButton.id = 'unblockButton';
        unblockButton.textContent = 'Unblock';
        unblockButton.className = 'w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 mt-2';
        unblockButton.onclick = handleUnblock;
        statusElement.after(unblockButton);
      } else {
        console.log('Block is not unlockable');
      }
    } else {
      saveButton.disabled = false;
      saveButton.classList.remove('opacity-50', 'cursor-not-allowed');
      userIdInput.disabled = false;
      blockConfigSection.style.display = 'block';
      
      const existingUnblockButton = document.getElementById('unblockButton');
      if (existingUnblockButton) {
        existingUnblockButton.remove();
      }
    }
  }

  async function fetchUserSettings(userId) {
    try {
      const { data, error } = await supabaseClient
        .from('user_settings')
        .select('block_state, block_end_time, is_unlockable, total_blocks, connected_platforms')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      console.log('Fetched user settings:', data);
      totalBlocks = data.total_blocks || 0;
      isUnlockable = data.is_unlockable || false;
      unlockableSwitch.checked = isUnlockable;
      updateUnlockableDescription();

      connectedPlatforms = data.connected_platforms || ["TradingView"];
      updatePlatformList();

      const now = new Date();
      const endTime = new Date(data.block_end_time);
      const isBlocked = data.block_state === 'active' && endTime > now;
      console.log('Updating UI - isBlocked:', isBlocked, 'isUnlockable:', data.is_unlockable);
      updateUIBasedOnBlockState(isBlocked, data.is_unlockable);

      if (isBlocked) {
        statusElement.textContent = `Block active until ${endTime.toLocaleString()}`;
        blockConfigSection.style.display = 'none';
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }
  }

  async function createUserSettings(userId) {
    try {
      const { data, error } = await supabaseClient
        .from('user_settings')
        .insert({ 
          user_id: userId, 
          total_blocks: 0, 
          connected_platforms: ["TradingView"]
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Created user settings:', data);
      connectedPlatforms = ["TradingView"];
      updatePlatformList();
    } catch (error) {
      console.error('Error creating user settings:', error.message, error.details);
    }
  }

  function updatePlatformList() {
    platformList.innerHTML = '';
    connectedPlatforms.forEach(platform => {
      const li = document.createElement('li');
      li.textContent = platform;
      platformList.appendChild(li);
    });
  }

  // Add this function to notify all tabs about the block state change
  function notifyAllTabs(isBlocked) {
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {action: "updateBlockState", isBlocked: isBlocked});
      });
    });
  }

  async function handleBlockActivation() {
    if (!isDurationSet() || !userId) {
      alert("Please set a duration for the block and ensure User ID is set.");
      return;
    }

    const endTime = new Date();
    endTime.setDate(endTime.getDate() + (parseInt(blockDuration.days) || 0));
    endTime.setHours(endTime.getHours() + (parseInt(blockDuration.hours) || 0));
    endTime.setMinutes(endTime.getMinutes() + (parseInt(blockDuration.minutes) || 0));

    // Immediately update local state
    const blockInfo = {
      action: "updateBlockState",
      isBlocked: true,
      endTime: endTime.toISOString(),
      blockedPlatforms: connectedPlatforms
    };
    chrome.storage.local.set({ tradeBlockerState: blockInfo }, function() {
      console.log('Block state saved to local storage');
    });

    // Update UI immediately
    statusElement.textContent = `Block active until ${endTime.toLocaleString()}`;
    blockConfigSection.style.display = 'none';
    updateUIBasedOnBlockState(true, isUnlockable);

    // Notify all tabs immediately
    notifyAllTabs(true);

    // Then update server state
    try {
      const { data, error } = await supabaseClient
        .from('user_settings')
        .update({
          block_state: 'active',
          block_end_time: endTime.toISOString(),
          is_unlockable: isUnlockable,
          total_blocks: totalBlocks + 1
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      totalBlocks += 1;
      console.log('Block activated on server, new state: active, end time:', endTime);
    } catch (error) {
      console.error('Error activating block on server:', error);
      alert('Error syncing block state with server. Local block is active, but may not persist.');
    }
  }

  async function handleUnblock() {
    // Immediately update local state
    const blockInfo = {
      action: "updateBlockState",
      isBlocked: false,
      endTime: null,
      blockedPlatforms: []
    };
    chrome.storage.local.set({ tradeBlockerState: blockInfo }, function() {
      console.log('Block state updated in local storage');
    });

    // Update UI immediately
    statusElement.textContent = 'Block deactivated';
    updateUIBasedOnBlockState(false, false);

    // Notify all tabs immediately
    notifyAllTabs(false);

    // Then update server state
    try {
      const { error } = await supabaseClient
        .from('user_settings')
        .update({ 
          block_state: 'inactive',
          block_end_time: new Date().toISOString() 
        })
        .eq('user_id', userId);

      if (error) throw error;
      console.log('Block deactivated on server');
    } catch (error) {
      console.error('Error removing block on server:', error);
      alert('Error syncing unblock state with server. Local unblock is active, but may not persist.');
    }
  }

  // Add a function to periodically sync with server
  function startServerSync() {
    setInterval(async () => {
      if (userId) {
        try {
          const { data, error } = await supabaseClient
            .from('user_settings')
            .select('block_state, block_end_time, is_unlockable')
            .eq('user_id', userId)
            .single();

          if (error) throw error;

          const now = new Date();
          const endTime = new Date(data.block_end_time);
          const isBlocked = data.block_state === 'active' && endTime > now;

          // Update local state if it differs from server state
          chrome.storage.local.get('tradeBlockerState', function(result) {
            const localState = result.tradeBlockerState;
            if (localState && localState.isBlocked !== isBlocked) {
              const newBlockInfo = {
                action: "updateBlockState",
                isBlocked: isBlocked,
                endTime: isBlocked ? data.block_end_time : null,
                blockedPlatforms: isBlocked ? connectedPlatforms : []
              };
              chrome.storage.local.set({ tradeBlockerState: newBlockInfo });
              updateUIBasedOnBlockState(isBlocked, data.is_unlockable);
            }
          });
        } catch (error) {
          console.error('Error syncing with server:', error);
        }
      }
    }, 60000); // Sync every minute
  }

  // Call this function when the popup is loaded
  startServerSync();
});
