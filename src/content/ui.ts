import { GeminiSolveResult, ParsedQuestion } from "../types";
import { getSettings, saveSettings } from "../services/storage";

function getLogoUrl(): string {
	try {
		if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
			return chrome.runtime.getURL("icons/icon48.png");
		}
	} catch {
		// ignore
	}
	return "";
}

/**
 * Creates and injects the modern solve button inside a question card
 */
export function injectQuestionButton(
	container: HTMLElement,
	onClick: (btn: HTMLButtonElement) => Promise<void>,
): HTMLButtonElement | null {
	if (container.querySelector(".ai-solver-btn-wrapper")) {
		return container.querySelector(".ai-solver-solve-btn");
	}

	const wrapper = document.createElement("div");
	wrapper.className = "ai-solver-btn-wrapper";

	const logoUrl = getLogoUrl();
	const logoHtml = logoUrl
		? `<img src="${logoUrl}" class="ai-solver-btn-icon" alt="" width="13" height="13">`
		: `<svg class="ai-solver-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
      </svg>`;

	const btn = document.createElement("button");
	btn.type = "button";
	btn.className = "ai-solver-solve-btn";
	btn.title = "Solve question and show explanation";
	btn.innerHTML = `
    <span>Solve</span>
  `;

	btn.addEventListener("click", async (e) => {
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
export function setButtonLoading(
	btn: HTMLButtonElement,
	isLoading: boolean,
	text: string = "Solving...",
) {
	if (isLoading) {
		btn.classList.add("loading");
		btn.disabled = true;
		btn.innerHTML = `
      <span class="ai-solver-spinner"></span>
      <span>${text}</span>
    `;
	} else {
		const logoUrl = getLogoUrl();
		const logoHtml = logoUrl
			? `<img src="${logoUrl}" class="ai-solver-btn-icon" alt="" width="13" height="13">`
			: `<svg class="ai-solver-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
        </svg>`;

		btn.classList.remove("loading");
		btn.disabled = false;
		btn.innerHTML = `
      <span>Solve</span>
    `;
	}
}

/**
 * Injects or updates the explanation card below the question
 */
export function renderExplanationCard(
	container: HTMLElement,
	result: GeminiSolveResult,
	question: ParsedQuestion,
) {
	// Remove existing card if any
	const existing = container.querySelector(
		".ai-solver-card, .ai-solver-error-card",
	);
	if (existing) {
		existing.remove();
	}

	const card = document.createElement("div");
	card.className = "ai-solver-card";

	// Format the answer display text
	let answerDisplay = "";
	if (
		question.type === "radio" ||
		question.type === "checkbox" ||
		question.type === "dropdown"
	) {
		if (result.selectedTexts && result.selectedTexts.length > 0) {
			answerDisplay = result.selectedTexts.join("; ");
		} else if (result.selectedIndices && result.selectedIndices.length > 0) {
			answerDisplay = result.selectedIndices
				.map((i) => question.options[i]?.text || `Option ${i + 1}`)
				.join("; ");
		} else {
			answerDisplay = "Answer selected";
		}
	} else {
		answerDisplay = result.textAnswer || "Answer entered";
	}

	const confidencePct = Math.round(result.confidence || 95);
	const logoUrl = getLogoUrl();
	const cardLogoHtml = logoUrl
		? `<img src="${logoUrl}" class="ai-solver-card-logo" alt="FormIQ" width="16" height="16">`
		: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
      </svg>`;

	card.innerHTML = `
    <div class="ai-solver-card-header">
      <div class="ai-solver-card-title">
        ${cardLogoHtml}
        <span>Answer Explanation</span>
        <span class="ai-solver-confidence-badge">${confidencePct}% confidence</span>
      </div>
      <button type="button" class="ai-solver-card-close" title="Close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div class="ai-solver-selected-answer">
      <div class="ai-solver-selected-answer-label">Selected Answer</div>
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
        <span>Copy Explanation</span>
      </button>
    </div>
  `;

	// Bind close
	card.querySelector(".ai-solver-card-close")?.addEventListener("click", () => {
		card.remove();
	});

	// Bind copy
	const copyBtn = card.querySelector(".copy-btn") as HTMLButtonElement;
	copyBtn?.addEventListener("click", async () => {
		try {
			await navigator.clipboard.writeText(result.explanation);
			const span = copyBtn.querySelector("span");
			if (span) {
				span.textContent = "✓ Copied!";
				setTimeout(() => {
					span.textContent = "Copy Explanation";
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
	const existing = container.querySelector(
		".ai-solver-card, .ai-solver-error-card",
	);
	if (existing) {
		existing.remove();
	}

	const errorCard = document.createElement("div");
	errorCard.className = "ai-solver-error-card";
	errorCard.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; font-weight:600;">
      <span style="display:flex; align-items:center; gap:6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Notice
      </span>
      <button type="button" class="ai-solver-card-close" style="color:#e53e3e;" title="Close">✕</button>
    </div>
    <div>${escapeHtml(errorMessage)}</div>
  `;

	errorCard
		.querySelector(".ai-solver-card-close")
		?.addEventListener("click", () => {
			errorCard.remove();
		});

	container.appendChild(errorCard);
}

export const SUPPORTED_MODELS_UI = [
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (Recommended • 5 RPM)' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash (Fast & Accurate • 5 RPM)' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (High Quota: 15 RPM / 500 RPD)' },
  { id: 'gemini-3-flash', label: 'Gemini 3 Flash (5 RPM / 20 RPD)' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite (High Quota: 15 RPM / 500 RPD)' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (5 RPM / 20 RPD)' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (Fast • 10 RPM / 20 RPD)' },
  { id: 'gemma-4-26b', label: 'Gemma 4 26B (High Speed • 30 RPM)' },
  { id: 'gemma-4-31b', label: 'Gemma 4 31B (High Speed • 30 RPM)' },
];

/**
 * Displays an interactive Quota Exceeded dialog directly on the page,
 * allowing the user to switch to another model and resume solving.
 */
export function showQuotaExceededModal({
  currentModel,
  onSwitchModelAndResume,
  onCancel,
}: {
  currentModel: string;
  onSwitchModelAndResume: (newModel: string) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const existingModal = document.getElementById('ai-solver-quota-modal');
  if (existingModal) existingModal.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'ai-solver-quota-modal';
  backdrop.className = 'ai-solver-modal-backdrop';

  // Find another recommended model that is not the currently exhausted one
  const nextModelOption =
    SUPPORTED_MODELS_UI.find((m) => m.id !== currentModel)?.id || 'gemini-3.5-flash-lite';

  const optionsHtml = SUPPORTED_MODELS_UI.map((m) => {
    const isExhausted = m.id === currentModel;
    const isSelected = m.id === nextModelOption;
    return `<option value="${m.id}" ${isSelected ? 'selected' : ''} ${isExhausted ? 'disabled' : ''}>
      ${m.label}${isExhausted ? ' (Exhausted / Исчерпана)' : ''}
    </option>`;
  }).join('');

  backdrop.innerHTML = `
    <div class="ai-solver-modal-dialog">
      <div class="ai-solver-modal-header">
        <div class="ai-solver-modal-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Rate Limit / Quota Exceeded</span>
        </div>
        <button type="button" class="ai-solver-modal-close" title="Close">✕</button>
      </div>

      <div class="ai-solver-modal-body">
        <p class="ai-solver-modal-desc">
          У модели <b>${escapeHtml(currentModel)}</b> исчерпан лимит запросов или квота (429 / Resource Exhausted).
          Чтобы продолжить решение без потери прогресса, выберите другую модель:
        </p>

        <div class="ai-solver-modal-select-wrapper">
          <label for="ai-solver-quota-model-select">Выберите другую модель:</label>
          <select id="ai-solver-quota-model-select" class="ai-solver-modal-select">
            ${optionsHtml}
          </select>
        </div>
      </div>

      <div class="ai-solver-modal-footer">
        <button type="button" class="ai-solver-modal-btn secondary cancel-btn">Отмена</button>
        <button type="button" class="ai-solver-modal-btn primary continue-btn">
          <span>⚡ Сменить модель и продолжить</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  const select = backdrop.querySelector('#ai-solver-quota-model-select') as HTMLSelectElement;
  const continueBtn = backdrop.querySelector('.continue-btn') as HTMLButtonElement;
  const cancelBtn = backdrop.querySelector('.cancel-btn') as HTMLButtonElement;
  const closeBtn = backdrop.querySelector('.ai-solver-modal-close') as HTMLButtonElement;

  const close = () => {
    backdrop.remove();
  };

  closeBtn.addEventListener('click', () => {
    close();
    onCancel?.();
  });
  cancelBtn.addEventListener('click', () => {
    close();
    onCancel?.();
  });

  continueBtn.addEventListener('click', async () => {
    const chosenModel = select.value;
    continueBtn.disabled = true;
    continueBtn.innerHTML = '<span>Переключение...</span>';
    await saveSettings({ model: chosenModel as any });
    close();
    await onSwitchModelAndResume(chosenModel);
  });
}

/**
 * Injects modern floating dock into page with auto-scroll toggle, skip answered toggle, model selector and logo
 */
export async function injectFloatingToolbar(
	onSolveAll: (
		btn: HTMLButtonElement,
		progress: (current: number, total: number) => void,
	) => Promise<void>,
) {
	if (document.getElementById("ai-solver-floating-bar")) return;

	const currentSettings = await getSettings();
	const logoUrl = getLogoUrl();
	const dockLogoHtml = logoUrl
		? `<img src="${logoUrl}" class="ai-solver-brand-logo" alt="FormIQ" width="18" height="18">`
		: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.3">
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
      </svg>`;

	const bar = document.createElement("div");
	bar.id = "ai-solver-floating-bar";
	bar.className = "ai-solver-floating-bar";

	bar.innerHTML = `
    <div class="ai-solver-bar-brand">
      <span>FormIQ</span>
    </div>

    <button type="button" id="ai-solver-solve-all" class="ai-solver-solve-all-btn" title="Automatically solve all questions">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
      <span class="btn-text">Solve All</span>
    </button>

    <div class="ai-solver-dock-model-wrapper" title="Active Model">
      <select id="ai-solver-dock-model" class="ai-solver-dock-model-select">
        ${SUPPORTED_MODELS_UI.map(
          (m) =>
            `<option value="${m.id}" ${m.id === currentSettings.model ? "selected" : ""}>${m.label}</option>`,
        ).join("")}
      </select>
    </div>

    <label class="ai-solver-scroll-toggle" title="Skip already answered questions">
      <input type="checkbox" id="ai-solver-skip-check" ${currentSettings.skipAnswered !== false ? "checked" : ""}>
      <span>Skip answered</span>
    </label>

    <label class="ai-solver-scroll-toggle" title="Smooth auto-scroll to current question">
      <input type="checkbox" id="ai-solver-scroll-check" ${currentSettings.autoScroll ? "checked" : ""}>
      <span>Auto-scroll</span>
    </label>

    <div id="ai-solver-progress-wrap" class="ai-solver-progress-bar-container">
      <div id="ai-solver-progress-fill" class="ai-solver-progress-bar-fill"></div>
    </div>

    <button type="button" class="ai-solver-floating-close" title="Hide Dock">✕</button>
  `;

	document.body.appendChild(bar);

	const solveAllBtn = bar.querySelector(
		"#ai-solver-solve-all",
	) as HTMLButtonElement;
	const dockModelSelect = bar.querySelector(
		"#ai-solver-dock-model",
	) as HTMLSelectElement;
	const skipCheck = bar.querySelector(
		"#ai-solver-skip-check",
	) as HTMLInputElement;
	const scrollCheck = bar.querySelector(
		"#ai-solver-scroll-check",
	) as HTMLInputElement;
	const progressWrap = bar.querySelector(
		"#ai-solver-progress-wrap",
	) as HTMLElement;
	const progressFill = bar.querySelector(
		"#ai-solver-progress-fill",
	) as HTMLElement;
	const closeBtn = bar.querySelector(
		".ai-solver-floating-close",
	) as HTMLButtonElement;

	// Listen to model change directly from floating dock
	dockModelSelect?.addEventListener("change", async () => {
		await saveSettings({ model: dockModelSelect.value as any });
	});

	// Listen to skipAnswered toggle change
	skipCheck?.addEventListener("change", async () => {
		await saveSettings({ skipAnswered: skipCheck.checked });
	});

	// Listen to autoScroll toggle change
	scrollCheck?.addEventListener("change", async () => {
		await saveSettings({ autoScroll: scrollCheck.checked });
	});

	// Synchronize if settings change from popup
	if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
		chrome.storage.onChanged.addListener((changes) => {
			if (changes.model && dockModelSelect && typeof changes.model.newValue === 'string') {
				dockModelSelect.value = changes.model.newValue;
			}
			if (changes.skipAnswered && skipCheck) {
				skipCheck.checked = Boolean(changes.skipAnswered.newValue);
			}
			if (changes.autoScroll && scrollCheck) {
				scrollCheck.checked = Boolean(changes.autoScroll.newValue);
			}
		});
	}

	closeBtn.addEventListener("click", () => {
		bar.remove();
	});

	solveAllBtn.addEventListener("click", async () => {
		solveAllBtn.disabled = true;
		progressWrap.style.display = "block";
		progressFill.style.width = "0%";

		const updateProgress = (current: number, total: number) => {
			const pct = total > 0 ? (current / total) * 100 : 0;
			progressFill.style.width = `${pct}%`;
			const textSpan = solveAllBtn.querySelector(".btn-text");
			if (textSpan) {
				textSpan.textContent = `(${current}/${total})...`;
			}
		};

		try {
			await onSolveAll(solveAllBtn, updateProgress);
			const textSpan = solveAllBtn.querySelector(".btn-text");
			if (textSpan) {
				textSpan.textContent = "✓ Completed!";
				setTimeout(() => {
					textSpan.textContent = "Solve All";
				}, 3000);
			}
		} catch (e) {
			console.error(e);
		} finally {
			solveAllBtn.disabled = false;
			setTimeout(() => {
				progressWrap.style.display = "none";
			}, 2000);
		}
	});
}

function escapeHtml(str: string): string {
	const div = document.createElement("div");
	div.textContent = str;
	return div.innerHTML;
}
