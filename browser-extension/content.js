function applyBlockingBehavior() {
  const style = document.createElement('style');
  style.textContent = 'div#bottom-area { display: none !important; }';
  document.head.appendChild(style);
  console.log('Blocking behavior applied');
}

function removeBlockingBehavior() {
  const style = document.querySelector('style');
  if (style && style.textContent.includes('div#bottom-area')) {
    style.remove();
    console.log('Blocking behavior removed');
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  if (request.action === "updateBlockState") {
    if (request.isBlocked) {
      applyBlockingBehavior();
    } else {
      removeBlockingBehavior();
    }
    sendResponse({ success: true });
  }
});

console.log('Content script loaded');