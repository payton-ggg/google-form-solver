import { ExtensionSettings, GeminiModel } from '../types';

const DEFAULT_SETTINGS: ExtensionSettings = {
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '',
  model: 'gemini-3.6-flash',
  autoScroll: true,
  language: 'auto',
};

export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      chrome.storage.sync.get(DEFAULT_SETTINGS as Record<string, any>, (items) => {
        const settings = {
          ...DEFAULT_SETTINGS,
          ...(items as Partial<ExtensionSettings>),
        };
        // If apiKey in storage is empty but .env had one, use that
        if (!settings.apiKey && DEFAULT_SETTINGS.apiKey) {
          settings.apiKey = DEFAULT_SETTINGS.apiKey;
        }
        resolve(settings);
      });
    } else if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(DEFAULT_SETTINGS as Record<string, any>, (items) => {
        resolve({ ...DEFAULT_SETTINGS, ...(items as Partial<ExtensionSettings>) });
      });
    } else {
      try {
        const local = localStorage.getItem('gemini_solver_settings');
        const parsed = local ? JSON.parse(local) : {};
        resolve({ ...DEFAULT_SETTINGS, ...parsed });
      } catch {
        resolve(DEFAULT_SETTINGS);
      }
    }
  });
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      chrome.storage.sync.set(settings as Record<string, any>, () => {
        resolve();
      });
    } else if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set(settings as Record<string, any>, () => {
        resolve();
      });
    } else {
      try {
        const current = localStorage.getItem('gemini_solver_settings');
        const parsed = current ? JSON.parse(current) : DEFAULT_SETTINGS;
        localStorage.setItem('gemini_solver_settings', JSON.stringify({ ...parsed, ...settings }));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
      resolve();
    }
  });
}
