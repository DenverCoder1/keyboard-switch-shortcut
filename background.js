// Background service worker
// Opens the settings/options page when the extension icon is clicked
chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});

// Open the settings page automatically on first install
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.runtime.openOptionsPage();
    }
});
