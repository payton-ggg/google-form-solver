import { getSettings, saveSettings } from '../services/storage';
import { testGeminiApiKey, listAvailableGeminiModels } from '../services/gemini';
import { GeminiModel, SupportedFont } from '../types';

const KNOWN_MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Fast, Recommended)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Highest Accuracy)' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (Fast & Lightweight)' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { id: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash-8B' },
];

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
  const toggleApiKeyBtn = document.getElementById('toggleApiKey') as HTMLButtonElement;
  const eyeIcon = document.getElementById('eyeIcon') as unknown as SVGElement;
  const modelSelect = document.getElementById('modelSelect') as HTMLSelectElement;
  const refreshModelsBtn = document.getElementById('refreshModelsBtn') as HTMLButtonElement;
  const fontSelect = document.getElementById('fontSelect') as HTMLSelectElement;
  const languageSelect = document.getElementById('languageSelect') as HTMLSelectElement;
  const autoScrollCheck = document.getElementById('autoScrollCheck') as HTMLInputElement;
  const testBtn = document.getElementById('testBtn') as HTMLButtonElement;
  const testSpinner = document.getElementById('testSpinner') as HTMLElement;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const feedbackBanner = document.getElementById('feedbackBanner') as HTMLElement;
  const bannerMessage = document.getElementById('bannerMessage') as HTMLElement;
  const bannerIcon = document.getElementById('bannerIcon') as HTMLElement;
  const statusIndicator = document.getElementById('statusIndicator') as HTMLElement;
  const statusText = document.getElementById('statusText') as HTMLElement;

  function applyFont(font: SupportedFont) {
    document.body.className = `font-${font}`;
  }

  function setModelOptions(modelsList: { id: string; label?: string; displayName?: string }[], selectedValue?: string) {
    if (!modelSelect) return;
    const currentVal = selectedValue || modelSelect.value || 'gemini-2.5-flash';
    modelSelect.innerHTML = '';

    const seen = new Set<string>();
    for (const item of modelsList) {
      if (!item.id || seen.has(item.id)) continue;
      seen.add(item.id);
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = item.label || item.displayName || item.id;
      if (item.id === currentVal) {
        opt.selected = true;
      }
      modelSelect.appendChild(opt);
    }

    // If currentVal is not in the list, append it as custom option
    if (currentVal && !seen.has(currentVal)) {
      const opt = document.createElement('option');
      opt.value = currentVal;
      opt.textContent = `${currentVal} (Custom)`;
      opt.selected = true;
      modelSelect.insertBefore(opt, modelSelect.firstChild);
    }
  }

  // Initial population of known models
  setModelOptions(KNOWN_MODELS);

  // Load existing settings
  const settings = await getSettings();
  let currentModel = settings.model || 'gemini-2.5-flash';

  // Migrate old non-existent models
  if (currentModel === 'gemini-3.6-flash' || currentModel === 'gemini-3.6-pro') {
    currentModel = 'gemini-2.5-flash';
  }

  if (apiKeyInput && settings.apiKey) {
    apiKeyInput.value = settings.apiKey;
  }
  if (modelSelect) {
    setModelOptions(KNOWN_MODELS, currentModel);
  }
  if (fontSelect && settings.fontFamily) {
    fontSelect.value = settings.fontFamily;
  }
  applyFont(settings.fontFamily || 'outfit');

  if (languageSelect && settings.language) {
    languageSelect.value = settings.language;
  }
  if (autoScrollCheck && typeof settings.autoScroll === 'boolean') {
    autoScrollCheck.checked = settings.autoScroll;
  }

  // Real-time font change
  if (fontSelect) {
    fontSelect.addEventListener('change', async () => {
      const selectedFont = fontSelect.value as SupportedFont;
      applyFont(selectedFont);
      await saveSettings({ fontFamily: selectedFont });
    });
  }

  // Check active tab URL
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url && tab.url.includes('docs.google.com/forms')) {
        statusIndicator.style.background = 'rgba(16, 185, 129, 0.15)';
        statusIndicator.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        statusIndicator.style.color = '#059669';
        statusText.textContent = 'Google Forms active';
      } else {
        statusIndicator.style.background = 'rgba(148, 163, 184, 0.15)';
        statusIndicator.style.borderColor = 'rgba(148, 163, 184, 0.3)';
        statusIndicator.style.color = '#64748b';
        statusText.textContent = 'Open Google Form';
      }
    } catch {
      // Ignore tab query errors
    }
  }

  // Toggle API Key visibility
  let isPasswordVisible = false;
  toggleApiKeyBtn.addEventListener('click', () => {
    isPasswordVisible = !isPasswordVisible;
    apiKeyInput.type = isPasswordVisible ? 'text' : 'password';
    if (isPasswordVisible) {
      eyeIcon.innerHTML = `
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
        <line x1="2" y1="2" x2="22" y2="22"/>
      `;
    } else {
      eyeIcon.innerHTML = `
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
        <circle cx="12" cy="12" r="3"/>
      `;
    }
  });

  function showBanner(success: boolean, message: string) {
    feedbackBanner.className = `feedback-banner ${success ? 'success' : 'error'}`;
    bannerIcon.innerHTML = success
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    bannerMessage.textContent = message;
    feedbackBanner.classList.remove('hidden');
  }

  // Fetch / Refresh available models from Gemini API
  async function handleFetchModels(silent = false) {
    const key = apiKeyInput.value.trim();
    if (!key) {
      if (!silent) showBanner(false, 'Please enter a Gemini API Key first to fetch available models.');
      return;
    }

    if (refreshModelsBtn) {
      refreshModelsBtn.disabled = true;
      refreshModelsBtn.textContent = '⏳ Loading...';
    }

    try {
      const fetched = await listAvailableGeminiModels(key);
      if (fetched.length > 0) {
        const formatted = fetched.map((m) => ({
          id: m.id,
          label: `${m.displayName || m.id}${m.id.includes('2.5-flash') ? ' (Recommended)' : ''}`,
        }));
        setModelOptions(formatted, modelSelect.value);
        if (!silent) {
          showBanner(true, `Successfully loaded ${fetched.length} available models from Gemini API.`);
        }
      } else if (!silent) {
        showBanner(false, 'No models found supporting generateContent for this key.');
      }
    } catch (err: any) {
      if (!silent) {
        showBanner(false, `Could not fetch models: ${err?.message || err}`);
      }
    } finally {
      if (refreshModelsBtn) {
        refreshModelsBtn.disabled = false;
        refreshModelsBtn.textContent = '🔄 Fetch Models';
      }
    }
  }

  if (refreshModelsBtn) {
    refreshModelsBtn.addEventListener('click', () => handleFetchModels(false));
  }

  // Test Connection
  testBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    const model = modelSelect.value as GeminiModel;

    testSpinner.style.display = 'inline-block';
    testBtn.disabled = true;
    feedbackBanner.classList.add('hidden');

    try {
      const res = await testGeminiApiKey(key, model);
      showBanner(res.success, res.message);
      if (res.success) {
        // Auto-save valid settings
        await saveSettings({
          apiKey: key,
          model,
          fontFamily: (fontSelect?.value as SupportedFont) || 'outfit',
          language: languageSelect.value as any,
          autoScroll: autoScrollCheck.checked,
        });
        // Auto-fetch updated models list in the background
        handleFetchModels(true).catch(() => {});
      }
    } catch (err: any) {
      showBanner(false, `Error: ${err?.message || err}`);
    } finally {
      testSpinner.style.display = 'none';
      testBtn.disabled = false;
    }
  });

  // Save Settings
  saveBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    const model = modelSelect.value as GeminiModel;
    const fontFamily = (fontSelect?.value as SupportedFont) || 'outfit';
    const language = languageSelect.value as any;
    const autoScroll = autoScrollCheck.checked;

    await saveSettings({
      apiKey: key,
      model,
      fontFamily,
      language,
      autoScroll,
    });

    const originalText = saveBtn.querySelector('.btn-text')?.textContent || 'Save Settings';
    if (saveBtn.querySelector('.btn-text')) {
      saveBtn.querySelector('.btn-text')!.textContent = '✓ Saved!';
    }
    showBanner(true, 'Settings saved successfully to extension storage.');
    setTimeout(() => {
      if (saveBtn.querySelector('.btn-text')) {
        saveBtn.querySelector('.btn-text')!.textContent = originalText;
      }
    }, 2000);
  });
});
