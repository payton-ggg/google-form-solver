// Google Forms AI Solver Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Google Forms AI Solver installed.');
    // Set default storage values if not already present
    chrome.storage.sync.get(['apiKey', 'model', 'language', 'autoScroll'], (result) => {
      chrome.storage.sync.set({
        apiKey: result.apiKey || '',
        model: result.model || 'gemini-3.6-flash',
        language: result.language || 'auto',
        autoScroll: typeof result.autoScroll === 'boolean' ? result.autoScroll : true,
      });
    });
  }
});

export {};
