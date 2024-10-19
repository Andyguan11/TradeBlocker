let isBlocked = false;

// TradingView-specific elements to block
const tradingViewBlockedElements = [
  "div.buttonsWrapper-hw_3o_pb.notAvailableOnMobile-hw_3o_pb",
  "div.layout__area--bottom",
  "div.menu-Tx5xMZww.context-menu.menuWrap-Kq3ruQo8"
];

let styleElement;

function ensureStyleElement() {
  if (!styleElement) {
    styleElement = document.createElement('style');
    if (document.head) {
      document.head.appendChild(styleElement);
    } else {
      // If document.head is not available, wait for it
      const observer = new MutationObserver(() => {
        if (document.head) {
          document.head.appendChild(styleElement);
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { childList: true });
    }
  }
}

// Call this function before using styleElement
ensureStyleElement();

function applyTradingViewBlocking() {
  ensureStyleElement();
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

function checkAndApplyBlock() {
  chrome.runtime.sendMessage({ action: "getInitialBlockState" }, (response) => {
    if (response) {
      updateBlockingState(response.isBlocked);
    }
  });
}

// Check block status immediately when the script loads
checkAndApplyBlock();

// Recheck block status when the page finishes loading
window.addEventListener('load', checkAndApplyBlock);

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateBlockState") {
    updateBlockingState(request.isBlocked);
    console.log('Received updateBlockState message:', request.isBlocked);
    sendResponse({success: true});
  }
});

// Periodically check block status
setInterval(checkAndApplyBlock, 30000);

console.log('Content script loaded');
