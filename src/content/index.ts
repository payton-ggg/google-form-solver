import { parseQuestionContainer, getAllQuestionContainers, isQuestionAnswered } from './parser';
import { applySolution } from './solver';
import {
  injectQuestionButton,
  setButtonLoading,
  renderExplanationCard,
  renderErrorCard,
  injectFloatingToolbar,
  showQuotaExceededModal,
} from './ui';
import { getSettings } from '../services/storage';
import { solveGoogleFormQuestion } from '../services/gemini';
import { SupportedFont } from '../types';

console.log('🚀 [FormIQ Assistant] Content script initialized.');

async function injectExtensionFonts() {
  const fontId = 'formiq-local-fonts';
  if (document.getElementById(fontId)) return;
  try {
    const templateUrl = chrome.runtime.getURL('fonts/fonts.css.template');
    const response = await fetch(templateUrl);
    const templateText = await response.text();
    const fontsBaseUrl = chrome.runtime.getURL('fonts');
    const resolvedCss = templateText.replaceAll('__FONT_BASE_URL__', fontsBaseUrl);

    const styleEl = document.createElement('style');
    styleEl.id = fontId;
    styleEl.textContent = resolvedCss;
    (document.head || document.documentElement).appendChild(styleEl);
  } catch (err) {
    console.warn('[FormIQ] Could not load local extension fonts:', err);
  }
}

const FONT_MAP: Record<string, string> = {
  'outfit': "'Outfit', sans-serif",
  'jakarta': "'Plus Jakarta Sans', sans-serif",
  'manrope': "'Manrope', sans-serif",
  'space-grotesk': "'Space Grotesk', sans-serif",
  'inter': "'Inter', sans-serif",
};

function applyFontClass(font?: SupportedFont | string) {
  const chosen = (font as SupportedFont) || 'outfit';
  const fontClasses = ['ai-font-outfit', 'ai-font-jakarta', 'ai-font-manrope', 'ai-font-space-grotesk', 'ai-font-inter'];
  
  fontClasses.forEach((cls) => {
    document.body?.classList.remove(cls);
    document.documentElement.classList.remove(cls);
  });

  document.body?.classList.add(`ai-font-${chosen}`);
  document.documentElement.classList.add(`ai-font-${chosen}`);

  const fontStyle = FONT_MAP[chosen] || FONT_MAP['outfit'];
  document.documentElement.style.setProperty('--ai-solver-font', fontStyle);
  if (document.body) {
    document.body.style.setProperty('--ai-solver-font', fontStyle);
  }
}

async function solveQuestion(
  container: HTMLElement,
  btn: HTMLButtonElement,
  index: number
): Promise<{ success: boolean; quotaExceeded?: boolean; error?: any }> {
  setButtonLoading(btn, true);

  try {
    const settings = await getSettings();
    if (!settings.apiKey || settings.apiKey.trim() === '') {
      renderErrorCard(
        container,
        'API key is not configured. Please open the FormIQ extension popup and enter your Gemini API key.'
      );
      setButtonLoading(btn, false);
      return { success: false };
    }

    // Auto scroll to question if enabled
    if (settings.autoScroll) {
      container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Parse question DOM
    const parsedQuestion = await parseQuestionContainer(container, index);
    if (!parsedQuestion) {
      renderErrorCard(container, 'Could not detect the structure of this question.');
      setButtonLoading(btn, false);
      return { success: false };
    }

    // Solve via Gemini API
    const result = await solveGoogleFormQuestion(parsedQuestion, settings);

    // Apply answer to DOM
    await applySolution(parsedQuestion, result);

    // Display Explanation Card
    renderExplanationCard(container, result, parsedQuestion);
    return { success: true };
  } catch (error: any) {
    console.error('Error during solve:', error);
    const isQuota = !!error?.isQuotaExceeded;
    renderErrorCard(container, error?.message || 'An error occurred while generating the answer.');
    return { success: false, quotaExceeded: isQuota, error };
  } finally {
    setButtonLoading(btn, false);
  }
}

let isSolvingAllActive = false;

async function solveAllQuestions(
  solveAllBtn: HTMLButtonElement,
  onProgress: (current: number, total: number) => void,
  startIndex: number = 0
) {
  if (isSolvingAllActive && startIndex === 0) return;
  isSolvingAllActive = true;

  try {
    const containers = getAllQuestionContainers();
    if (containers.length === 0) return;

    for (let i = startIndex; i < containers.length; i++) {
      const settings = await getSettings();
      const shouldSkip = settings.skipAnswered !== false;

      const container = containers[i];
      const btn = container.querySelector('.ai-solver-solve-btn') as HTMLButtonElement;
      if (!btn) {
        onProgress(i + 1, containers.length);
        continue;
      }

      // Check if question is already answered and should be skipped
      if (shouldSkip) {
        const parsed = await parseQuestionContainer(container, i);
        if (parsed && isQuestionAnswered(parsed)) {
          btn.innerHTML = '<span>✓ Answered</span>';
          btn.title = 'Question already answered (skipped according to settings)';
          onProgress(i + 1, containers.length);
          continue;
        }
      }

      if (settings.autoScroll) {
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Smooth scroll transition delay
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      const outcome = await solveQuestion(container, btn, i);

      // If model quota is exhausted, STOP immediately and show recovery modal
      if (outcome.quotaExceeded) {
        isSolvingAllActive = false;
        showQuotaExceededModal({
          currentModel: settings.model || 'gemini-3.8-flash',
          onSwitchModelAndResume: async (newModel) => {
            console.log(`[FormIQ] Switched to ${newModel}. Resuming solve from question #${i + 1}...`);
            await solveAllQuestions(solveAllBtn, onProgress, i);
          },
          onCancel: () => {
            const textSpan = solveAllBtn.querySelector('.btn-text');
            if (textSpan) {
              textSpan.textContent = 'Solve All';
            }
          },
        });
        return;
      }

      onProgress(i + 1, containers.length);
      // Slight pause to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  } finally {
    isSolvingAllActive = false;
  }
}

async function scanAndAttach() {
  const settings = await getSettings();
  applyFontClass(settings.fontFamily || 'outfit');

  const containers = getAllQuestionContainers();
  containers.forEach((container, index) => {
    injectQuestionButton(container, async (btn) => {
      const outcome = await solveQuestion(container, btn, index);
      if (outcome.quotaExceeded) {
        const currentSettings = await getSettings();
        showQuotaExceededModal({
          currentModel: currentSettings.model || 'gemini-3.8-flash',
          onSwitchModelAndResume: async (newModel) => {
            console.log(`[FormIQ] Retrying question #${index + 1} with ${newModel}...`);
            await solveQuestion(container, btn, index);
          },
        });
      }
    });
  });

  if (containers.length > 0) {
    await injectFloatingToolbar(solveAllQuestions);
  }
}

// Inject local extension fonts into page
injectExtensionFonts();

// Listen to dynamic font changes from storage
if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.fontFamily) {
      applyFontClass(changes.fontFamily.newValue as SupportedFont);
    }
  });
}

// Initial scan
scanAndAttach();

// Observe DOM mutations for dynamic question loading / multipage forms
const observer = new MutationObserver(() => {
  scanAndAttach();
});

if (document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}
