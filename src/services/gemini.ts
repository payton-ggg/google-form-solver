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

export class GeminiQuotaError extends Error {
  isQuotaExceeded = true;
  model: string;
  constructor(message: string, model: string) {
    super(message);
    this.name = 'GeminiQuotaError';
    this.model = model;
  }
}

/**
 * Checks whether a model is actually supported for text-based form solving
 * (filtering out zero-quota models, audio/TTS, embeddings, image/video generators, and specialized preview agents).
 */
export function isSupportedFormModel(modelId: string): boolean {
  const clean = modelId.toLowerCase().replace(/^models\//, '');

  // Exclude non-text/specialized modalities and preview agents
  const excludedKeywords = [
    'tts',
    'audio',
    'transcribe',
    'dialog',
    'speech',
    'embedding',
    'embed',
    'robotics',
    'imagen',
    'veo',
    'banana',
    'lyria',
    'computer-use',
    'deep-research',
    'antigravity',
  ];
  if (excludedKeywords.some((kw) => clean.includes(kw))) {
    return false;
  }

  // Exclude models known to have 0 quota or no public access in standard tiers
  const zeroQuotaModels = [
    'gemini-2.5-pro',
    'gemini-3.1-pro',
    'gemini-4-argon',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2-flash',
    'gemini-2-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash-8b',
  ];
  if (zeroQuotaModels.some((unsupported) => clean === unsupported || clean.startsWith(`${unsupported}-`))) {
    return false;
  }

  return true;
}

const MODEL_PRIORITY: Record<string, number> = {
  'gemini-3.8-flash': 100,
  'gemini-3.6-flash': 90,
  'gemini-3.5-flash-lite': 85,
  'gemini-3-flash': 80,
  'gemini-3-flash-preview': 79,
  'gemini-3.1-flash-lite': 75,
  'gemini-2.5-flash': 70,
  'gemini-2.5-flash-lite': 65,
  'gemma-4-26b': 50,
  'gemma-4-31b': 49,
};

/**
 * Fetch all available models from Gemini API that actually support generateContent for form solving
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
    .filter(
      (m: any) =>
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes('generateContent') &&
        isSupportedFormModel(m.name || '')
    )
    .map((m: any) => ({
      id: m.name ? m.name.replace(/^models\//, '') : '',
      displayName: m.displayName || m.name?.replace(/^models\//, '') || '',
      description: m.description || '',
      supportedMethods: m.supportedGenerationMethods || [],
    }))
    .filter((m: GeminiModelInfo) => m.id.length > 0)
    .sort((a: GeminiModelInfo, b: GeminiModelInfo) => {
      const pA = MODEL_PRIORITY[a.id] || 0;
      const pB = MODEL_PRIORITY[b.id] || 0;
      return pB - pA;
    });
}

/**
 * Quick validation of API key and selected model against Google Gemini API
 */
export async function testGeminiApiKey(apiKey: string, model: GeminiModel = 'gemini-3.8-flash'): Promise<GeminiTestResult> {
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

  const model = (settings.model || 'gemini-3.8-flash').replace(/^models\//, '');
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

  let typeSpecificInstructions = '';
  if (question.type === 'checkbox') {
    typeSpecificInstructions = `
CRITICAL INSTRUCTION FOR MULTIPLE-CHOICE (CHECKBOX):
- THIS QUESTION TYPE ALLOWS AND EXPECTS MULTIPLE CORRECT ANSWERS.
- DO NOT PICK JUST ONE OPTION if multiple options are valid/correct!
- Carefully evaluate EACH option independently.
- If 2, 3, or more options are correct, you MUST return ALL their indices in "selectedIndices" (e.g. [0, 2] or [0, 1, 3]) and their full texts in "selectedTexts".
- Returning only 1 option when multiple options are correct is strictly penalized.`;
  } else if (question.type === 'radio' || question.type === 'dropdown') {
    typeSpecificInstructions = `
INSTRUCTION FOR SINGLE-CHOICE (RADIO/DROPDOWN):
- Select exactly ONE best option in "selectedIndices" (e.g. [1]) and its text in "selectedTexts".`;
  }

  const systemInstructions = `You are an expert AI assistant dedicated to accurately solving tests and questionnaires in Google Forms.
Your task is to analyze the question (including attached images, if any), the answer options, and determine the exact correct answer(s).

Question Details:
- Type: ${question.type} (radio: single choice, checkbox: multiple choices, text: short answer, paragraph: long answer, dropdown: select dropdown)
- Question title: "${question.title}"
${optionsText ? `- Available options:\n${optionsText}` : '- Free text input field'}
${typeSpecificInstructions}

Requirements:
1. For "checkbox": Carefully evaluate all options. Select ALL correct and applicable indices in "selectedIndices" (e.g. [0, 2]) and their exact texts in "selectedTexts".
2. For "radio" and "dropdown": choose exactly 1 correct index in "selectedIndices" (e.g. [0]) and its text in "selectedTexts".
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

      const isQuota =
        response.status === 429 ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.toLowerCase().includes('quota') ||
        msg.toLowerCase().includes('rate limit');

      if (isQuota) {
        throw new GeminiQuotaError(
          `Quota or rate limit reached for model "${model}". Please select another model to continue. (${msg})`,
          model
        );
      }

      if (response.status === 400 || response.status === 403) {
        throw new Error(`Gemini API access error (${response.status}): ${msg}. Please check your API key.`);
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
