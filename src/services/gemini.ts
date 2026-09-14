import { ExtensionSettings, GeminiSolveResult, ParsedQuestion, GeminiModel } from '../types';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface GeminiTestResult {
  success: boolean;
  message: string;
}

/**
 * Quick validation of API key and selected model against Google Gemini API
 */
export async function testGeminiApiKey(apiKey: string, model: GeminiModel = 'gemini-3.6-flash'): Promise<GeminiTestResult> {
  if (!apiKey || apiKey.trim() === '') {
    return { success: false, message: 'Ключ API не указан. Введите Gemini API Key.' };
  }

  const endpoint = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey.trim()}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Ответь словом "OK" если ты работаешь.' }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 10,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || `Ошибка HTTP ${response.status}: ${response.statusText}`;
      if (response.status === 400 || response.status === 403) {
        return { success: false, message: `Неверный API ключ или нет доступа к модели ${model}. (${errorMsg})` };
      }
      return { success: false, message: `Ошибка Gemini API: ${errorMsg}` };
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (reply) {
      return { success: true, message: `Подключение успешно! Модель: ${model}` };
    }
    return { success: false, message: 'Пустой ответ от Gemini API' };
  } catch (error: any) {
    return { success: false, message: `Ошибка сети: ${error?.message || error}` };
  }
}

/**
 * Solve a Google Form question using Gemini API with text & multimodal image support
 */
export async function solveGoogleFormQuestion(
  question: ParsedQuestion,
  settings: ExtensionSettings
): Promise<GeminiSolveResult> {
  const apiKey = settings.apiKey?.trim();
  if (!apiKey) {
    throw new Error('API ключ Gemini не установлен. Откройте настройки расширения в панели браузера и введите ключ.');
  }

  const model = settings.model || 'gemini-3.6-flash';
  const endpoint = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  // Build the prompt parts
  const promptParts: any[] = [];

  // Add images if any
  if (question.images && question.images.length > 0) {
    for (const img of question.images) {
      if (img.base64 && img.mimeType) {
        promptParts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.base64,
          },
        });
      }
    }
  }

  // Build options description
  let optionsText = '';
  if (question.options.length > 0) {
    optionsText = question.options
      .map((opt, i) => `[Вариант ${i}]: ${opt.text}`)
      .join('\n');
  }

  const languagePrompt =
    settings.language === 'ru'
      ? 'Объяснение дай на русском языке.'
      : settings.language === 'en'
      ? 'Provide the explanation in English.'
      : 'Provide the explanation in the same language as the question.';

  const systemInstructions = `Ты — экспертный ИИ-ассистент для точного решения тестов и заданий в Google Формах.
Твоя задача — проанализировать вопрос (включая изображения, если они есть), варианты ответов и определить единственно верный или все верные ответы.

Формат вопроса:
- Тип: ${question.type} (radio: одиночный выбор, checkbox: множественный выбор, text: короткий ответ, paragraph: развернутый ответ, dropdown: выпадающий список)
- Текст вопроса: "${question.title}"
${optionsText ? `- Доступные варианты:\n${optionsText}` : '- Поле для свободного ввода ответа'}

Требования:
1. Для "radio" и "dropdown": выбери ровно 1 правильный индекс в "selectedIndices" (например [0]) и его текст в "selectedTexts".
2. Для "checkbox": выбери ВСЕ правильные индексы в "selectedIndices" (например [0, 2]) и их тексты в "selectedTexts".
3. Для "text" и "paragraph": сформулируй максимально точный и лаконичный ответ в "textAnswer".
4. Укажи "confidence" от 0 до 100 (уверенность в ответе).
5. Напиши "explanation" — четкое, понятное пошаговое объяснение, почему этот ответ верный. ${languagePrompt}

Верни ответ СТРОГО в формате JSON:
{
  "selectedIndices": [number],
  "selectedTexts": [string],
  "textAnswer": string,
  "confidence": number,
  "explanation": string
}`;

  promptParts.push({ text: systemInstructions });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: promptParts,
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      if (response.status === 400 || response.status === 403) {
        throw new Error(`Ошибка доступа к Gemini API (${response.status}): ${msg}. Проверьте ваш API ключ.`);
      }
      if (response.status === 429) {
        throw new Error('Превышен лимит запросов к Gemini API (Rate Limit). Подождите несколько секунд.');
      }
      throw new Error(`Ошибка Gemini API: ${msg}`);
    }

    const data = await response.json();
    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      throw new Error('Gemini вернул пустой ответ или ответ был заблокирован фильтром безопасности.');
    }

    // Parse JSON
    let parsed: any;
    try {
      // Clean possible markdown code fences if model returned them
      const cleaned = rawContent.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.warn('Failed to parse strict JSON, attempting regex extraction:', rawContent);
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`Не удалось распарсить JSON ответ от Gemini: ${rawContent}`);
      }
    }

    return {
      questionType: question.type,
      selectedIndices: Array.isArray(parsed.selectedIndices) ? parsed.selectedIndices : [],
      selectedTexts: Array.isArray(parsed.selectedTexts) ? parsed.selectedTexts : [],
      textAnswer: parsed.textAnswer || '',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 95,
      explanation: parsed.explanation || 'Объяснение не предоставлено.',
      rawResponse: rawContent,
    };
  } catch (error: any) {
    console.error('Error solving question with Gemini:', error);
    throw error;
  }
}
