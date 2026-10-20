import { ParsedQuestion, GeminiSolveResult } from '../types';

/**
 * Programmatically simulates a realistic user click on an element
 */
function simulateClick(element: HTMLElement) {
  element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  const mouseEvents = ['mouseover', 'mousedown', 'mouseup', 'click'];
  mouseEvents.forEach((eventType) => {
    const event = new MouseEvent(eventType, {
      view: window,
      bubbles: true,
      cancelable: true,
      buttons: 1,
    });
    element.dispatchEvent(event);
  });
}

/**
 * Programmatically sets value on an input or textarea with full event dispatching
 */
function setInputValue(inputEl: HTMLInputElement | HTMLTextAreaElement, value: string) {
  inputEl.focus();
  
  // Set native value setter if available (bypasses React/Closure synthetic value traps)
  const prototype = inputEl instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(inputEl, value);
  } else {
    inputEl.value = value;
  }

  // Trigger input, change and blur events
  inputEl.dispatchEvent(new Event('input', { bubbles: true }));
  inputEl.dispatchEvent(new Event('change', { bubbles: true }));
  inputEl.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
}

/**
 * Applies the Gemini solution to the DOM elements of the Google Form question
 */
export async function applySolution(question: ParsedQuestion, result: GeminiSolveResult): Promise<boolean> {
  try {
    if (question.type === 'radio') {
      let targetOption = null;

      // Try by index first
      if (result.selectedIndices && result.selectedIndices.length > 0) {
        const idx = result.selectedIndices[0];
        if (idx >= 0 && idx < question.options.length) {
          targetOption = question.options[idx];
        }
      }

      // Fallback: match by text
      if (!targetOption && result.selectedTexts && result.selectedTexts.length > 0) {
        const textTarget = result.selectedTexts[0].toLowerCase().trim();
        targetOption = question.options.find((opt) => opt.text.toLowerCase().trim() === textTarget) || null;
      }

      if (targetOption) {
        const clickTarget = (targetOption.inputElement || targetOption.element) as HTMLElement;
        simulateClick(clickTarget);
        return true;
      }
    } else if (question.type === 'checkbox') {
      const targetIndices = new Set<number>();

      if (Array.isArray(result.selectedIndices) && result.selectedIndices.length > 0) {
        for (const idx of result.selectedIndices) {
          if (idx >= 0 && idx < question.options.length) {
            targetIndices.add(idx);
          }
        }
      }

      // Fallback matching by text
      if (targetIndices.size === 0 && Array.isArray(result.selectedTexts) && result.selectedTexts.length > 0) {
        for (const text of result.selectedTexts) {
          const textLower = text.toLowerCase().trim();
          const foundIdx = question.options.findIndex((o) => o.text.toLowerCase().trim() === textLower);
          if (foundIdx !== -1) {
            targetIndices.add(foundIdx);
          }
        }
      }

      let appliedCount = 0;
      for (let i = 0; i < question.options.length; i++) {
        const opt = question.options[i];
        const clickTarget = (opt.inputElement || opt.element) as HTMLElement;
        const isChecked = clickTarget.getAttribute('aria-checked') === 'true';
        const shouldBeChecked = targetIndices.has(i);

        if (shouldBeChecked && !isChecked) {
          simulateClick(clickTarget);
          await new Promise((r) => setTimeout(r, 80));
          appliedCount++;
        } else if (!shouldBeChecked && isChecked) {
          // Deselect options that were previously checked but are not in the solution
          simulateClick(clickTarget);
          await new Promise((r) => setTimeout(r, 80));
        } else if (shouldBeChecked && isChecked) {
          appliedCount++;
        }
      }

      return appliedCount > 0;
    } else if (question.type === 'text' || question.type === 'paragraph') {
      const input = question.textInput || (question.container.querySelector('input, textarea') as HTMLInputElement);
      if (input && result.textAnswer) {
        setInputValue(input, result.textAnswer);
        return true;
      }
    } else if (question.type === 'dropdown') {
      if (result.selectedIndices && result.selectedIndices.length > 0) {
        const idx = result.selectedIndices[0];
        if (idx >= 0 && idx < question.options.length) {
          const opt = question.options[idx];
          simulateClick(opt.element);
          return true;
        }
      }
    }

    return false;
  } catch (err) {
    console.error('Failed to apply solution to DOM:', err);
    return false;
  }
}
