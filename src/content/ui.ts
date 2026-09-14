import { GeminiSolveResult, ParsedQuestion } from '../types';
import { getSettings, saveSettings } from '../services/storage';

/**
 * Creates and injects the modern solve button inside a question card
 */
export function injectQuestionButton(
  container: HTMLElement,
  onClick: (btn: HTMLButtonElement) => Promise<void>
): HTMLButtonElement | null {
  if (container.querySelector('.ai-solver-btn-wrapper')) {
    return container.querySelector('.ai-solver-solve-btn');
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'ai-solver-btn-wrapper';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ai-solver-solve-btn';
  btn.title = 'Решить вопрос и показать объяснение';
  btn.innerHTML = `
    <svg class="ai-solver-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"/>
    </svg>
    <span>Решить</span>
  `;

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await onClick(btn);
  });

  wrapper.appendChild(btn);

  // Insert at top of question card
  if (container.firstChild) {
    container.insertBefore(wrapper, container.firstChild);
  } else {
    container.appendChild(wrapper);
  }

  return btn;
}

/**
 * Updates button appearance during solve process
 */
export function setButtonLoading(btn: HTMLButtonElement, isLoading: boolean, text: string = 'Решение...') {
  if (isLoading) {
    btn.classList.add('loading');
    btn.disabled = true;
    btn.innerHTML = `
      <span class="ai-solver-spinner"></span>
      <span>${text}</span>
    `;
  } else {
    btn.classList.remove('loading');
    btn.disabled = false;
    btn.innerHTML = `
      <svg class="ai-solver-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"/>
      </svg>
      <span>Решить</span>
    `;
  }
}

/**
 * Injects or updates the explanation card below the question
 */
export function renderExplanationCard(
  container: HTMLElement,
  result: GeminiSolveResult,
  question: ParsedQuestion
) {
  // Remove existing card if any
  const existing = container.querySelector('.ai-solver-card, .ai-solver-error-card');
  if (existing) {
    existing.remove();
  }

  const card = document.createElement('div');
  card.className = 'ai-solver-card';

  // Format the answer display text
  let answerDisplay = '';
  if (question.type === 'radio' || question.type === 'checkbox' || question.type === 'dropdown') {
    if (result.selectedTexts && result.selectedTexts.length > 0) {
      answerDisplay = result.selectedTexts.join('; ');
    } else if (result.selectedIndices && result.selectedIndices.length > 0) {
      answerDisplay = result.selectedIndices.map((i) => question.options[i]?.text || `Вариант ${i + 1}`).join('; ');
    } else {
      answerDisplay = 'Ответ выбран';
    }
  } else {
    answerDisplay = result.textAnswer || 'Введен ответ';
  }

  const confidencePct = Math.round(result.confidence || 95);

  card.innerHTML = `
    <div class="ai-solver-card-header">
      <div class="ai-solver-card-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
        <span>Пояснение к ответу</span>
        <span class="ai-solver-confidence-badge">${confidencePct}% точность</span>
      </div>
      <button type="button" class="ai-solver-card-close" title="Закрыть">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div class="ai-solver-selected-answer">
      <div class="ai-solver-selected-answer-label">Выбранный ответ</div>
      <div class="ai-solver-selected-answer-value">${escapeHtml(answerDisplay)}</div>
    </div>

    <div class="ai-solver-explanation-body">
      ${escapeHtml(result.explanation)}
    </div>

    <div class="ai-solver-card-actions">
      <button type="button" class="ai-solver-action-btn copy-btn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </svg>
        <span>Скопировать</span>
      </button>
    </div>
  `;

  // Bind close
  card.querySelector('.ai-solver-card-close')?.addEventListener('click', () => {
    card.remove();
  });

  // Bind copy
  const copyBtn = card.querySelector('.copy-btn') as HTMLButtonElement;
  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(result.explanation);
      const span = copyBtn.querySelector('span');
      if (span) {
        span.textContent = '✓ Скопировано';
        setTimeout(() => {
          span.textContent = 'Скопировать';
        }, 2000);
      }
    } catch {
      // Fallback
    }
  });

  container.appendChild(card);
}

/**
 * Displays error card inside the question container
 */
export function renderErrorCard(container: HTMLElement, errorMessage: string) {
  const existing = container.querySelector('.ai-solver-card, .ai-solver-error-card');
  if (existing) {
    existing.remove();
  }

  const errorCard = document.createElement('div');
  errorCard.className = 'ai-solver-error-card';
  errorCard.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; font-weight:600;">
      <span style="display:flex; align-items:center; gap:6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Внимание
      </span>
      <button type="button" class="ai-solver-card-close" style="color:#e53e3e;" title="Закрыть">✕</button>
    </div>
    <div>${escapeHtml(errorMessage)}</div>
  `;

  errorCard.querySelector('.ai-solver-card-close')?.addEventListener('click', () => {
    errorCard.remove();
  });

  container.appendChild(errorCard);
}

/**
 * Injects modern floating dock into page with auto-scroll toggle
 */
export async function injectFloatingToolbar(
  onSolveAll: (btn: HTMLButtonElement, progress: (current: number, total: number) => void) => Promise<void>
) {
  if (document.getElementById('ai-solver-floating-bar')) return;

  const currentSettings = await getSettings();

  const bar = document.createElement('div');
  bar.id = 'ai-solver-floating-bar';
  bar.className = 'ai-solver-floating-bar';

  bar.innerHTML = `
    <div class="ai-solver-bar-brand">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.2">
        <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"/>
      </svg>
      <span>AI Solver</span>
    </div>

    <button type="button" id="ai-solver-solve-all" class="ai-solver-solve-all-btn" title="Автоматически решить все вопросы">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
      <span class="btn-text">Решить все</span>
    </button>

    <label class="ai-solver-scroll-toggle" title="Плавная автопрокрутка к текущему вопросу">
      <input type="checkbox" id="ai-solver-scroll-check" ${currentSettings.autoScroll ? 'checked' : ''}>
      <span>Скролл</span>
    </label>

    <div id="ai-solver-progress-wrap" class="ai-solver-progress-bar-container">
      <div id="ai-solver-progress-fill" class="ai-solver-progress-bar-fill"></div>
    </div>

    <button type="button" class="ai-solver-floating-close" title="Скрыть панель">✕</button>
  `;

  document.body.appendChild(bar);

  const solveAllBtn = bar.querySelector('#ai-solver-solve-all') as HTMLButtonElement;
  const scrollCheck = bar.querySelector('#ai-solver-scroll-check') as HTMLInputElement;
  const progressWrap = bar.querySelector('#ai-solver-progress-wrap') as HTMLElement;
  const progressFill = bar.querySelector('#ai-solver-progress-fill') as HTMLElement;
  const closeBtn = bar.querySelector('.ai-solver-floating-close') as HTMLButtonElement;

  // Listen to autoScroll toggle change
  scrollCheck.addEventListener('change', async () => {
    await saveSettings({ autoScroll: scrollCheck.checked });
  });

  closeBtn.addEventListener('click', () => {
    bar.remove();
  });

  solveAllBtn.addEventListener('click', async () => {
    solveAllBtn.disabled = true;
    progressWrap.style.display = 'block';
    progressFill.style.width = '0%';

    const updateProgress = (current: number, total: number) => {
      const pct = total > 0 ? (current / total) * 100 : 0;
      progressFill.style.width = `${pct}%`;
      const textSpan = solveAllBtn.querySelector('.btn-text');
      if (textSpan) {
        textSpan.textContent = `(${current}/${total})...`;
      }
    };

    try {
      await onSolveAll(solveAllBtn, updateProgress);
      const textSpan = solveAllBtn.querySelector('.btn-text');
      if (textSpan) {
        textSpan.textContent = '✓ Решено!';
        setTimeout(() => {
          textSpan.textContent = 'Решить все';
        }, 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      solveAllBtn.disabled = false;
      setTimeout(() => {
        progressWrap.style.display = 'none';
      }, 2000);
    }
  });
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
