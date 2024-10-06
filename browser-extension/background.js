chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    return {
      redirectUrl: "http://localhost:8080/" + details.url
    };
  },
  {
    urls: ["<all_urls>"],
    types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
  },
  ["blocking"]
);

chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    var userId = localStorage.getItem('userId');
    if (userId) {
      details.requestHeaders.push({name: "X-User-Id", value: userId});
    }
    return {requestHeaders: details.requestHeaders};
  },
  {urls: ["<all_urls>"]},
  ["blocking", "requestHeaders"]
);