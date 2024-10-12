document.addEventListener('DOMContentLoaded', function() {
  const userIdInput = document.getElementById('userId');
  const saveButton = document.getElementById('saveButton');
  const statusElement = document.getElementById('status');

  // Check if user ID is already set
  chrome.storage.sync.get(['userId'], function(result) {
    if (result.userId) {
      userIdInput.value = result.userId;
      statusElement.textContent = 'User ID set. Blocking ready.';
    }
  });

  saveButton.addEventListener('click', function() {
    const userId = userIdInput.value.trim();
    if (userId) {
      chrome.runtime.sendMessage({action: "setUserId", userId: userId}, function(response) {
        if (response && response.success) {
          statusElement.textContent = 'User ID set. Blocking ready.';
        } else {
          statusElement.textContent = 'Error setting User ID. Please try again.';
        }
      });
    } else {
      statusElement.textContent = 'Please enter a valid User ID.';
    }
  });
});
