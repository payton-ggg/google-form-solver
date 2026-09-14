import { parseQuestionContainer, getAllQuestionContainers } from './parser';
import { applySolution } from './solver';
import {
  injectQuestionButton,
  setButtonLoading,
  renderExplanationCard,
  renderErrorCard,
  injectFloatingToolbar,
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

async function solveQuestion(container: HTMLElement, btn: HTMLButtonElement, index: number) {
  setButtonLoading(btn, true);

  try {
    const settings = await getSettings();
    if (!settings.apiKey || settings.apiKey.trim() === '') {
      renderErrorCard(
        container,
        'API ключ не установлен. Откройте настройки расширения в браузере и введите ключ.'
      );
      setButtonLoading(btn, false);
      return;
    }

    // Auto scroll to question if enabled
    if (settings.autoScroll) {
      container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Parse question DOM
    const parsedQuestion = await parseQuestionContainer(container, index);
    if (!parsedQuestion) {
      renderErrorCard(container, 'Не удалось распознать структуру вопроса.');
      setButtonLoading(btn, false);
      return;
    }

    // Solve via Gemini API
    const result = await solveGoogleFormQuestion(parsedQuestion, settings);

    // Apply answer to DOM
    await applySolution(parsedQuestion, result);

    // Display Explanation Card
    renderExplanationCard(container, result, parsedQuestion);
  } catch (error: any) {
    console.error('Error during solve:', error);
    renderErrorCard(container, error?.message || 'Произошла ошибка при получении ответа.');
  } finally {
    setButtonLoading(btn, false);
  }
}

async function solveAllQuestions(
  _solveAllBtn: HTMLButtonElement,
  onProgress: (current: number, total: number) => void
) {
  const containers = getAllQuestionContainers();
  if (containers.length === 0) return;

  for (let i = 0; i < containers.length; i++) {
    const container = containers[i];
    const btn = container.querySelector('.ai-solver-solve-btn') as HTMLButtonElement;
    if (btn) {
      const settings = await getSettings();
      if (settings.autoScroll) {
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Smooth scroll transition delay
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      await solveQuestion(container, btn, i);
    }
    onProgress(i + 1, containers.length);
    // Slight pause to avoid hitting aggressive rate limits
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
}

async function scanAndAttach() {
  const settings = await getSettings();
  applyFontClass(settings.fontFamily || 'outfit');

  const containers = getAllQuestionContainers();
  containers.forEach((container, index) => {
    injectQuestionButton(container, async (btn) => {
      await solveQuestion(container, btn, index);
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
