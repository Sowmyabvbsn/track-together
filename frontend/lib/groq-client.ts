interface GroqConfig {
  apiKey: string;
  model: string;
  enabled: boolean;
}

const GROQ_CONFIG: GroqConfig = {
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || '',
  model: 'llama-3.3-70b-versatile',
  enabled: !!process.env.NEXT_PUBLIC_GROQ_API_KEY,
};

export class GroqClient {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.groq.com/openai/v1';

  constructor(config?: Partial<GroqConfig>) {
    this.apiKey = config?.apiKey || GROQ_CONFIG.apiKey;
    this.model = config?.model || GROQ_CONFIG.model;
  }

  async chat(messages: { role: string; content: string }[], options: any = {}) {
    try {
      if (!this.apiKey || this.apiKey === 'your_groq_api_key_here') {
        throw new Error('Groq API key not configured');
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1024,
          top_p: options.top_p || 1,
          stream: false,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.statusText} - ${error}`);
      }

      const data = await response.json();
      return {
        message: {
          content: data.choices[0]?.message?.content || '',
          role: data.choices[0]?.message?.role || 'assistant',
        },
        usage: data.usage,
      };
    } catch (error) {
      console.error('Groq chat error:', error);
      throw error;
    }
  }

  async generate(prompt: string, options: any = {}) {
    try {
      const response = await this.chat(
        [{ role: 'user', content: prompt }],
        options
      );
      return {
        response: response.message.content,
        usage: response.usage,
      };
    } catch (error) {
      console.error('Groq generate error:', error);
      throw error;
    }
  }

  async checkHealth() {
    try {
      if (!this.apiKey || this.apiKey === 'your_groq_api_key_here') {
        return false;
      }

      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  isConfigured() {
    return !!(this.apiKey && this.apiKey !== 'your_groq_api_key_here');
  }
}

export const groqClient = new GroqClient();

export const AI_CONFIG = {
  enabled: GROQ_CONFIG.enabled,
  provider: 'groq',
  model: GROQ_CONFIG.model,
  features: {
    safetyMonitoring: true,
    messageAnalysis: true,
    routeOptimization: true,
    predictiveAnalytics: true,
  },
};

export const checkAIHealth = async () => {
  const health = await groqClient.checkHealth();
  return {
    groq: health,
    model: GROQ_CONFIG.model,
    configured: groqClient.isConfigured(),
  };
};
