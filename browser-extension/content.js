let isBlocked = false; // Default to unblocked state
let isSetup = false;

// Update the blockedElements array
const blockedElements = [
  "div.buttonsWrapper-hw_3o_pb.notAvailableOnMobile-hw_3o_pb",
  "div.layout__area--bottom",
  "div.menu-Tx5xMZww.context-menu.menuWrap-Kq3ruQo8"
];

// Create a style element
const styleElement = document.createElement('style');
document.head.appendChild(styleElement);

function applyBlockingBehavior() {
  const cssRules = blockedElements.map(selector => `${selector} { display: none !important; }`).join('\n');
  styleElement.textContent = cssRules;
}

function removeBlockingBehavior() {
  styleElement.textContent = '';
}

// Function to update blocking state
function updateBlockingState(shouldBlock) {
  if (isBlocked !== shouldBlock) {
    isBlocked = shouldBlock;
    if (isBlocked && isSetup) {
      applyBlockingBehavior();
    } else {
      removeBlockingBehavior();
    }
    console.log(`Blocking ${isBlocked && isSetup ? 'applied' : 'removed'}`);
  }
}

// Request initial block state from background script
chrome.runtime.sendMessage({ action: "getInitialBlockState" }, (response) => {
  if (response) {
    isSetup = response.isSetup;
    updateBlockingState(response.isBlocked);
  }
});

// Set up a MutationObserver to watch for DOM changes
const observer = new MutationObserver(() => {
  if (isBlocked) {
    applyBlockingBehavior();
  }
});
observer.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateBlockState") {
    isSetup = true;
    updateBlockingState(request.isBlocked);
    sendResponse({ success: true });
  }
});

// Listen for changes in localStorage
window.addEventListener('storage', function(e) {
  if (e.key === 'tradeBlockerState') {
    const state = JSON.parse(e.newValue);
    if (state && state.action === "updateBlockState") {
      updateBlockingState(state.isBlocked);
    }
  }
});

console.log('Content script loaded');
