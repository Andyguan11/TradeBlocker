let isBlocked = false;
let blockedPlatforms = [];

// TradingView-specific elements to block
const tradingViewBlockedElements = [
  "div.buttonsWrapper-hw_3o_pb.notAvailableOnMobile-hw_3o_pb",
  "div.layout__area--bottom",
  "div.menu-Tx5xMZww.context-menu.menuWrap-Kq3ruQo8"
];

// Create a style element
const styleElement = document.createElement('style');
document.head.appendChild(styleElement);

function applyTradingViewBlocking() {
  const cssRules = tradingViewBlockedElements.map(selector => `${selector} { display: none !important; }`).join('\n');
  styleElement.textContent = cssRules;
}

function removeBlockingBehavior() {
  styleElement.textContent = '';
}

function applyFullPageBlock() {
  let overlay = document.getElementById('tradeBlocker-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'tradeBlocker-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: black;
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2147483647;
      font-size: 24px;
    `;
    overlay.textContent = 'Trading is currently blocked.';
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
}

function removeFullPageBlock() {
  const overlay = document.getElementById('tradeBlocker-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

function updateBlockingState(shouldBlock) {
  isBlocked = shouldBlock;
  if (isBlocked) {
    if (window.location.hostname.includes('tradingview.com')) {
      applyTradingViewBlocking();
    } else {
      applyFullPageBlock();
    }
  } else {
    removeBlockingBehavior();
    removeFullPageBlock();
  }
  console.log(`Blocking ${isBlocked ? 'applied' : 'removed'}`);
}

// Add this near the top of the file
window.addEventListener('storage', function(e) {
  if (e.key === 'tradeBlockerState') {
    const state = JSON.parse(e.newValue);
    if (state && state.action === "updateBlockState") {
      updateBlockingState(state.isBlocked);
    }
  }
});

// Apply blocking immediately if the page is already loaded
if (document.readyState === 'complete') {
  updateBlockingState(isBlocked);
} else {
  window.addEventListener('load', () => updateBlockingState(isBlocked));
}

// Request initial block state from background script
chrome.runtime.sendMessage({ action: "getInitialBlockState" }, (response) => {
  if (response) {
    isSetup = response.isSetup;
    isBlocked = response.isBlocked;
    blockedPlatforms = response.blockedPlatforms;
    updateBlockingState(response.isBlocked);
  }
});

// Set up a MutationObserver for TradingView
if (window.location.hostname.includes('tradingview.com')) {
  const observer = new MutationObserver(() => {
    if (isBlocked) {
      applyTradingViewBlocking();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateBlockState") {
    isSetup = true;
    updateBlockingState(request.isBlocked);
    console.log('Received updateBlockState message:', request.isBlocked);
    sendResponse({success: true});
  }
  if (request.action === "updateContentScript") {
    isBlocked = request.isBlocked;
    blockedPlatforms = request.blockedPlatforms;
    applyBlock();
  }
  if (request.action === "extensionSetupComplete") {
    window.postMessage({ action: "extensionSetupComplete", userId: request.userId }, "*");
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

function applyBlock() {
  if (isBlocked && blockedPlatforms.some(platform => window.location.hostname.includes(platform.toLowerCase()))) {
    document.body.innerHTML = '<h1>This site is currently blocked.</h1>';
  }
}

console.log('Content script loaded');
