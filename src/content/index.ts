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

console.log('🚀 [Google Forms AI Solver] Content script initialized.');

async function solveQuestion(container: HTMLElement, btn: HTMLButtonElement, index: number) {
  setButtonLoading(btn, true);

  try {
    const settings = await getSettings();
    if (!settings.apiKey || settings.apiKey.trim() === '') {
      renderErrorCard(
        container,
        '⚠️ API ключ Gemini не установлен. Пожалуйста, откройте иконку расширения в правом верхнем углу браузера и введите ваш Gemini API Key.'
      );
      setButtonLoading(btn, false);
      return;
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

    // Auto scroll if enabled
    if (settings.autoScroll) {
      container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } catch (error: any) {
    console.error('Error during AI solve:', error);
    renderErrorCard(container, error?.message || 'Произошла непредвиденная ошибка при обращении к ИИ.');
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
      await solveQuestion(container, btn, i);
    }
    onProgress(i + 1, containers.length);
    // Slight pause to avoid hitting aggressive rate limits
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
}

function scanAndAttach() {
  const containers = getAllQuestionContainers();
  containers.forEach((container, index) => {
    injectQuestionButton(container, async (btn) => {
      await solveQuestion(container, btn, index);
    });
  });

  if (containers.length > 0) {
    injectFloatingToolbar(solveAllQuestions);
  }
}

// Initial scan
scanAndAttach();

// Observe DOM mutations for dynamic question loading / multipage forms
const observer = new MutationObserver(() => {
  scanAndAttach();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
