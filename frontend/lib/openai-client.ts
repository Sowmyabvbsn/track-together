// Enhanced OpenAI client with better error handling and fallback support

let _openai: any = null;
let _serverOpenAI: any = null;

// Lazy initialization to avoid errors when OpenAI is not available
export const getOpenAI = () => {
  if (!_openai && typeof window !== 'undefined' && process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    try {
      const OpenAI = require('openai');
      _openai = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });
    } catch (error) {
      console.warn('OpenAI client initialization failed:', error);
    }
  }
  return _openai;
};

export const getServerOpenAI = () => {
  if (!_serverOpenAI && process.env.OPENAI_API_KEY) {
    try {
      const OpenAI = require('openai');
      _serverOpenAI = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } catch (error) {
      console.warn('Server OpenAI client initialization failed:', error);
    }
  }
  return _serverOpenAI;
};

// Legacy exports for backward compatibility
export const openai = getOpenAI();
export const serverOpenAI = getServerOpenAI();

export const AI_CONFIG = {
  enabled: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  fallbackMode: !process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  geminiApiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  huggingFaceApiKey: process.env.NEXT_PUBLIC_HUGGING_FACE_API_KEY,
  models: {
    chat: 'gpt-4o-mini', // More cost-effective model
    vision: 'gpt-4o',
    embedding: 'text-embedding-3-small',
    tts: 'tts-1',
    stt: 'whisper-1'
  },
  limits: {
    maxTokens: 1000,
    temperature: 0.3,
    maxRetries: 3
  },
  features: {
    messageAnalysis: true,
    routeOptimization: true,
    safetyMonitoring: true,
    voiceCommands: true,
    smartReplies: true,
    predictiveAnalytics: true
  }
};

// Health check function
export const checkAIHealth = async () => {
  const status = {
    openai: false,
    gemini: false,
    huggingface: false,
    fallbackMode: AI_CONFIG.fallbackMode
  };
  
  if (AI_CONFIG.openaiApiKey) {
    try {
      const client = getOpenAI();
      if (client) {
        // Simple test request
        await client.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5
        });
        status.openai = true;
      }
    } catch (error) {
      console.warn('OpenAI health check failed:', error);
    }
  }
  
  return status;
};