import { ExtensionSettings, GeminiSolveResult, ParsedQuestion, GeminiModel } from '../types';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface GeminiTestResult {
  success: boolean;
  message: string;
}

export interface GeminiModelInfo {
  id: string;
  displayName: string;
  description?: string;
  supportedMethods: string[];
}

/**
 * Fetch all available models from Gemini API that support generateContent
 */
export async function listAvailableGeminiModels(apiKey: string): Promise<GeminiModelInfo[]> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API key is missing. Please enter a valid Gemini API Key.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(`Failed to list models: ${errorMsg}`);
  }

  const data = await response.json();
  const models = data?.models || [];

  return models
    .filter((m: any) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
    .map((m: any) => ({
      id: m.name ? m.name.replace(/^models\//, '') : '',
      displayName: m.displayName || m.name?.replace(/^models\//, '') || '',
      description: m.description || '',
      supportedMethods: m.supportedGenerationMethods || [],
    }))
    .filter((m: GeminiModelInfo) => m.id.length > 0);
}

/**
 * Quick validation of API key and selected model against Google Gemini API
 */
export async function testGeminiApiKey(apiKey: string, model: GeminiModel = 'gemini-2.5-flash'): Promise<GeminiTestResult> {
  if (!apiKey || apiKey.trim() === '') {
    return { success: false, message: 'API key is missing. Please enter a valid Gemini API Key.' };
  }

  const cleanModel = model.replace(/^models\//, '');
  const endpoint = `${GEMINI_API_BASE}/${cleanModel}:generateContent?key=${apiKey.trim()}`;

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
            parts: [{ text: 'Respond with the word "OK" if you are working.' }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 10,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      if (response.status === 400 || response.status === 403 || response.status === 404) {
        return { success: false, message: `Model error (${cleanModel}): ${errorMsg}` };
      }
      return { success: false, message: `Gemini API Error: ${errorMsg}` };
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (reply) {
      return { success: true, message: `Connection successful! Model: ${cleanModel}` };
    }
    return { success: false, message: 'Empty response from Gemini API' };
  } catch (error: any) {
    return { success: false, message: `Network error: ${error?.message || error}` };
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
    throw new Error('Gemini API key is not configured. Please open FormIQ settings and enter your key.');
  }

  const model = (settings.model || 'gemini-2.5-flash').replace(/^models\//, '');
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
      .map((opt, i) => `[Option ${i}]: ${opt.text}`)
      .join('\n');
  }

  const languagePrompt =
    settings.language === 'ru'
      ? 'Provide the explanation in Russian.'
      : settings.language === 'en'
      ? 'Provide the explanation in English.'
      : 'Provide the explanation in the same language as the question.';

  const systemInstructions = `You are an expert AI assistant dedicated to accurately solving tests and questionnaires in Google Forms.
Your task is to analyze the question (including attached images, if any), the answer options, and determine the exact correct answer(s).

Question Details:
- Type: ${question.type} (radio: single choice, checkbox: multiple choices, text: short answer, paragraph: long answer, dropdown: select dropdown)
- Question title: "${question.title}"
${optionsText ? `- Available options:\n${optionsText}` : '- Free text input field'}

Requirements:
1. For "radio" and "dropdown": choose exactly 1 correct index in "selectedIndices" (e.g. [0]) and its text in "selectedTexts".
2. For "checkbox": choose ALL correct indices in "selectedIndices" (e.g. [0, 2]) and their texts in "selectedTexts".
3. For "text" and "paragraph": formulate the most precise and concise answer in "textAnswer".
4. Provide a "confidence" score between 0 and 100.
5. Write an "explanation" — a clear, step-by-step reasoning explaining why this answer is correct. ${languagePrompt}

Return the response STRICTLY as valid JSON matching this schema:
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
        throw new Error(`Gemini API access error (${response.status}): ${msg}. Please check your API key.`);
      }
      if (response.status === 429) {
        throw new Error('Gemini API rate limit exceeded. Please wait a few seconds.');
      }
      throw new Error(`Gemini API error: ${msg}`);
    }

    const data = await response.json();
    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      throw new Error('Gemini returned an empty response or the response was blocked by safety filters.');
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
        throw new Error(`Failed to parse JSON response from Gemini: ${rawContent}`);
      }
    }

    return {
      questionType: question.type,
      selectedIndices: Array.isArray(parsed.selectedIndices) ? parsed.selectedIndices : [],
      selectedTexts: Array.isArray(parsed.selectedTexts) ? parsed.selectedTexts : [],
      textAnswer: parsed.textAnswer || '',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 95,
      explanation: parsed.explanation || 'No explanation provided.',
      rawResponse: rawContent,
    };
  } catch (error: any) {
    console.error('Error solving question with Gemini:', error);
    throw error;
  }
}
