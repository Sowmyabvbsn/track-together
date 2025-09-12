import OpenAI from 'openai';

// Client-side OpenAI instance
export const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Server-side OpenAI instance (for backend)
export const serverOpenAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const AI_CONFIG = {
  enabled: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  models: {
    chat: 'gpt-4-turbo-preview',
    vision: 'gpt-4-vision-preview',
    embedding: 'text-embedding-3-small',
    tts: 'tts-1',
    stt: 'whisper-1'
  }
};