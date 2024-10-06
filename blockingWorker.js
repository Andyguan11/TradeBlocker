addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  })
  
  async function handleRequest(request) {
    const url = new URL(request.url);
    const userId = request.headers.get('X-User-ID');
  
    if (url.hostname.includes('tradingview.com')) {
      const isBlocked = await checkUserBlockPreference(userId);
      
      if (isBlocked) {
        let response = await fetch(request);
        
        if (response.headers.get('Content-Type').includes('text/html')) {
          let text = await response.text();
          text = text.replace(/<div id="bottom-area"[\s\S]*?<\/div>/gi, '');
          
          return new Response(text, {
            headers: response.headers
          });
        }
        return response;
      }
    }
    
    // If not TradingView or user not blocked, just pass through the reques
  return fetch(request);
}

async function checkUserBlockPreference(userId) {
  if (!userId) return false;
  let blockStatus = await USER_BLOCK_STATUS.get(userId);
  return blockStatus === 'true';
}