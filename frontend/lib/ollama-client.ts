interface OllamaConfig {
  baseUrl: string;
  model: string;
  enabled: boolean;
}

const OLLAMA_CONFIG: OllamaConfig = {
  baseUrl: process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11434',
  model: process.env.NEXT_PUBLIC_OLLAMA_MODEL || 'llama2',
  enabled: true,
};

export class OllamaClient {
  private baseUrl: string;
  private model: string;

  constructor(config?: Partial<OllamaConfig>) {
    this.baseUrl = config?.baseUrl || OLLAMA_CONFIG.baseUrl;
    this.model = config?.model || OLLAMA_CONFIG.model;
  }

  async chat(messages: { role: string; content: string }[], options: any = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            top_p: options.top_p || 0.9,
            ...options,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        message: {
          content: data.message?.content || '',
          role: data.message?.role || 'assistant',
        },
        done: data.done,
      };
    } catch (error) {
      console.error('Ollama chat error:', error);
      throw error;
    }
  }

  async generate(prompt: string, options: any = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            ...options,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        response: data.response || '',
        done: data.done,
      };
    } catch (error) {
      console.error('Ollama generate error:', error);
      throw error;
    }
  }

  async streamChat(
    messages: { role: string; content: string }[],
    onChunk: (text: string) => void,
    options: any = {}
  ) {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: true,
          options: {
            temperature: options.temperature || 0.7,
            ...options,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const json = JSON.parse(line);
              if (json.message?.content) {
                onChunk(json.message.content);
              }
            } catch (e) {
              console.warn('Failed to parse streaming response:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Ollama stream error:', error);
      throw error;
    }
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Failed to list models:', error);
      return [];
    }
  }
}

export const ollamaClient = new OllamaClient();

export const AI_CONFIG = {
  enabled: true,
  ollamaUrl: OLLAMA_CONFIG.baseUrl,
  ollamaModel: OLLAMA_CONFIG.model,
  features: {
    safetyMonitoring: true,
    messageAnalysis: true,
    routeOptimization: true,
    predictiveAnalytics: true,
  },
};

export const checkAIHealth = async () => {
  const health = await ollamaClient.checkHealth();
  return {
    ollama: health,
    model: OLLAMA_CONFIG.model,
    baseUrl: OLLAMA_CONFIG.baseUrl,
  };
};
