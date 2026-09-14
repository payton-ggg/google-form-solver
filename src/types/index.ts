export type GeminiModel =
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.0-flash'
  | 'gemini-2.0-flash-lite'
  | 'gemini-1.5-flash'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash-8b'
  | (string & {});

export type SupportedFont = 'outfit' | 'jakarta' | 'manrope' | 'space-grotesk' | 'inter';

export interface ExtensionSettings {
  apiKey: string;
  model: GeminiModel;
  autoScroll: boolean;
  language: 'auto' | 'ru' | 'en';
  fontFamily: SupportedFont;
}

export type QuestionType = 'radio' | 'checkbox' | 'text' | 'paragraph' | 'dropdown' | 'unknown';

export interface ParsedOption {
  index: number;
  text: string;
  element: HTMLElement;
  inputElement?: HTMLElement | HTMLInputElement;
}

export interface QuestionImage {
  src: string;
  alt?: string;
  base64?: string;
  mimeType?: string;
}

export interface ParsedQuestion {
  id: string;
  container: HTMLElement;
  title: string;
  type: QuestionType;
  required: boolean;
  options: ParsedOption[];
  textInput?: HTMLInputElement | HTMLTextAreaElement;
  images: QuestionImage[];
}

export interface GeminiSolveResult {
  questionType: QuestionType;
  selectedIndices?: number[];
  selectedTexts?: string[];
  textAnswer?: string;
  confidence: number;
  explanation: string;
  rawResponse?: string;
}
