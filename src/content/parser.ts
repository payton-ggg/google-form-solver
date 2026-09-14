import { ParsedQuestion, ParsedOption, QuestionType, QuestionImage } from '../types';

/**
 * Convert an <img> element to base64 string and mimeType
 */
export async function extractImageBase64(img: HTMLImageElement): Promise<QuestionImage | null> {
  const src = img.src || img.getAttribute('data-src') || '';
  if (!src || src.startsWith('chrome-extension://')) {
    return null;
  }

  // If already data URL
  if (src.startsWith('data:image/')) {
    const match = src.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (match) {
      return {
        src,
        alt: img.alt || '',
        mimeType: match[1],
        base64: match[2],
      };
    }
  }

  try {
    const response = await fetch(src);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const match = result.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (match) {
          resolve({
            src,
            alt: img.alt || '',
            mimeType: match[1] || blob.type || 'image/jpeg',
            base64: match[2],
          });
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    // Cross-origin fallback using canvas
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width || 300;
      canvas.height = img.naturalHeight || img.height || 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (match) {
          return {
            src,
            alt: img.alt || '',
            mimeType: match[1],
            base64: match[2],
          };
        }
      }
    } catch {
      console.warn('Could not extract image data:', src);
    }
    return null;
  }
}

/**
 * Parses a single Google Form question container (.Qr7Oae)
 */
export async function parseQuestionContainer(container: HTMLElement, index: number): Promise<ParsedQuestion | null> {
  if (!container) return null;

  const id = container.getAttribute('data-item-id') || `question-${index}-${Date.now()}`;

  // 1. Title
  const titleEl =
    container.querySelector('.M7eMe') ||
    container.querySelector('[role="heading"]') ||
    container.querySelector('.HoLwm') ||
    container.querySelector('.ahS2le');

  let title = titleEl ? (titleEl.textContent || '').trim() : '';
  
  // Secondary description
  const descEl = container.querySelector('.g6ldxf') || container.querySelector('.e4eG1b');
  if (descEl && descEl.textContent) {
    title += `\n(Description: ${descEl.textContent.trim()})`;
  }

  // 2. Images inside the question
  const imgElements = Array.from(container.querySelectorAll('img')).filter((img) => {
    // Skip small UI icons or profile avatars
    if (img.width > 0 && img.width < 32 && img.height > 0 && img.height < 32) return false;
    if (img.classList.contains('ai-solver-icon')) return false;
    return true;
  }) as HTMLImageElement[];

  const images: QuestionImage[] = [];
  for (const img of imgElements) {
    const extracted = await extractImageBase64(img);
    if (extracted) {
      images.push(extracted);
    }
  }

  // 3. Determine Question Type and Options
  let type: QuestionType = 'unknown';
  const options: ParsedOption[] = [];
  let textInput: HTMLInputElement | HTMLTextAreaElement | undefined;

  // Check for radio buttons
  const radioGroup = container.querySelector('[role="radiogroup"]') || container.querySelector('.appsMaterialWizToggleRadiogroupEl');
  const radioItems = container.querySelectorAll('[role="radio"]');

  // Check for checkboxes
  const checkboxItems = container.querySelectorAll('[role="checkbox"]');

  // Check for text inputs
  const shortTextInput = container.querySelector('input.whsOnd') || container.querySelector('input[type="text"]') as HTMLInputElement;
  const paragraphInput = container.querySelector('textarea.KHxj8b') || container.querySelector('textarea') as HTMLTextAreaElement;

  // Check for dropdown / listbox
  const listbox = container.querySelector('[role="listbox"]');

  if (radioGroup || (radioItems.length > 0 && checkboxItems.length === 0)) {
    type = 'radio';
    // Parse radio items
    const optionContainers = container.querySelectorAll('.docssharedWizToggleLabeledContainer, .nWQGrd, [role="radio"]');
    
    // Deduplicate and extract
    const seenElements = new Set<Element>();
    let optIndex = 0;

    optionContainers.forEach((el) => {
      // Find the clickable radio wrapper
      const radioEl = el.getAttribute('role') === 'radio' ? el : el.querySelector('[role="radio"]') || el;
      if (seenElements.has(radioEl)) return;
      seenElements.add(radioEl);

      // Text can be inside data-value or label text
      let text = radioEl.getAttribute('data-value') || '';
      if (!text) {
        const label = el.querySelector('.aDTYNe, .ulDsOb, .bzfPab') || el;
        text = (label.textContent || '').trim();
      }

      options.push({
        index: optIndex++,
        text: text || `Option ${optIndex}`,
        element: radioEl as HTMLElement,
        inputElement: radioEl as HTMLElement,
      });
    });
  } else if (checkboxItems.length > 0) {
    type = 'checkbox';
    const optionContainers = container.querySelectorAll('.docssharedWizToggleLabeledContainer, .Y6Holder, [role="checkbox"]');
    const seenElements = new Set<Element>();
    let optIndex = 0;

    optionContainers.forEach((el) => {
      const checkEl = el.getAttribute('role') === 'checkbox' ? el : el.querySelector('[role="checkbox"]') || el;
      if (seenElements.has(checkEl)) return;
      seenElements.add(checkEl);

      let text = checkEl.getAttribute('data-value') || '';
      if (!text) {
        const label = el.querySelector('.aDTYNe, .ulDsOb, .bzfPab') || el;
        text = (label.textContent || '').trim();
      }

      options.push({
        index: optIndex++,
        text: text || `Option ${optIndex}`,
        element: checkEl as HTMLElement,
        inputElement: checkEl as HTMLElement,
      });
    });
  } else if (paragraphInput) {
    type = 'paragraph';
    textInput = paragraphInput as HTMLTextAreaElement;
  } else if (shortTextInput) {
    type = 'text';
    textInput = shortTextInput as HTMLInputElement;
  } else if (listbox) {
    type = 'dropdown';
    const dropdownOptions = listbox.querySelectorAll('[role="option"]');
    dropdownOptions.forEach((opt, i) => {
      options.push({
        index: i,
        text: (opt.textContent || opt.getAttribute('data-value') || `Option ${i + 1}`).trim(),
        element: opt as HTMLElement,
      });
    });
  }

  // If title was somehow empty, fallback
  if (!title) {
    title = `Question #${index + 1}`;
  }

  return {
    id,
    container,
    title,
    type,
    required: !!container.querySelector('[aria-label*="обязательный"], [aria-label*="required"], .v3duvd'),
    options,
    textInput,
    images,
  };
}

/**
 * Finds all Google Form question elements on the current page
 */
export function getAllQuestionContainers(): HTMLElement[] {
  const containers = Array.from(document.querySelectorAll('.Qr7Oae')) as HTMLElement[];
  return containers;
}
