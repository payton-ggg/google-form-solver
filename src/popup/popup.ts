import { getSettings, saveSettings } from '../services/storage';
import { testGeminiApiKey } from '../services/gemini';
import { GeminiModel, SupportedFont } from '../types';

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
  const toggleApiKeyBtn = document.getElementById('toggleApiKey') as HTMLButtonElement;
  const eyeIcon = document.getElementById('eyeIcon') as unknown as SVGElement;
  const modelSelect = document.getElementById('modelSelect') as HTMLSelectElement;
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

  // Load existing settings
  const settings = await getSettings();
  if (apiKeyInput && settings.apiKey) {
    apiKeyInput.value = settings.apiKey;
  }
  if (modelSelect && settings.model) {
    modelSelect.value = settings.model;
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
        // Also auto-save valid settings
        await saveSettings({
          apiKey: key,
          model,
          fontFamily: (fontSelect?.value as SupportedFont) || 'outfit',
          language: languageSelect.value as any,
          autoScroll: autoScrollCheck.checked,
        });
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
