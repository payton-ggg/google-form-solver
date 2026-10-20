// Google Forms AI Solver Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Google Forms AI Solver installed.');
    // Set default storage values if not already present
    chrome.storage.sync.get(['apiKey', 'model', 'language', 'autoScroll'], (result) => {
      const unsupported = [
        'gemini-2.5-pro',
        'gemini-3.1-pro',
        'gemini-4-argon',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-2-flash',
        'gemini-2-flash-lite',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-1.5-flash-8b',
      ];
      const modelStr = typeof result.model === 'string' ? result.model : '';
      const validModel = modelStr && !unsupported.includes(modelStr) ? modelStr : 'gemini-3.8-flash';
      chrome.storage.sync.set({
        apiKey: result.apiKey || '',
        model: validModel,
        language: result.language || 'auto',
        autoScroll: typeof result.autoScroll === 'boolean' ? result.autoScroll : true,
      });
    });
  }
});

export {};
