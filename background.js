// Called when the url of a tab changes.
function checkForValidUrl(tabId, changeInfo, tab) {
  // Make sure we are in Google Photos...
  if (/photos.google.com$/.test(tab.url)) {
    // ... show the page action.
    chrome.pageAction.show(tabId);
  }
};



// Listen for any changes to the URL of any tab.
chrome.tabs.onUpdated.addListener(checkForValidUrl);

