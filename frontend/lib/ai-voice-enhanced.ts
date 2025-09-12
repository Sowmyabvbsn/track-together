import { openai, AI_CONFIG } from './openai-client';

export class EnhancedVoiceService {
  private static recognition: SpeechRecognition | null = null;
  private static synthesis: SpeechSynthesis | null = null;
  private static isInitialized = false;

  static async initialize() {
    if (typeof window === 'undefined' || this.isInitialized) return;

    try {
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
      }

      // Initialize speech synthesis
      this.synthesis = window.speechSynthesis;
      this.isInitialized = true;
    } catch (error) {
      console.error('Voice service initialization failed:', error);
    }
  }

  // Enhanced voice command processing with OpenAI
  static async processVoiceCommand(
    onResult: (result: any) => void,
    onError?: (error: string) => void,
    context?: any
  ) {
    if (!this.recognition) {
      await this.initialize();
    }

    if (!this.recognition) {
      onError?.('Speech recognition not supported');
      return;
    }

    this.recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;

      try {
        // Process with OpenAI for better understanding
        const analysis = await this.analyzeVoiceCommand(transcript, context);
        
        onResult({
          transcript,
          confidence,
          analysis,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Voice command analysis failed:', error);
        onResult({
          transcript,
          confidence,
          analysis: this.getBasicCommandAnalysis(transcript),
          timestamp: new Date().toISOString()
        });
      }
    };

    this.recognition.onerror = (event) => {
      onError?.(event.error);
    };

    this.recognition.start();
  }

  private static async analyzeVoiceCommand(transcript: string, context: any) {
    if (!AI_CONFIG.enabled) {
      return this.getBasicCommandAnalysis(transcript);
    }

    try {
      const prompt = `
Analyze this voice command for a group ride coordination app:

VOICE COMMAND: "${transcript}"
CONTEXT: ${context ? JSON.stringify(context) : 'No context'}

Determine the intent and generate appropriate actions in JSON format:
{
  "intent": {
    "primary": "emergency|location|eta|message|navigation|status",
    "confidence": number (0-1),
    "parameters": object
  },
  "actions": [
    {
      "type": "send_location|send_message|emergency_alert|share_eta|navigate",
      "priority": "low|medium|high|critical",
      "data": object
    }
  ],
  "response": string,
  "needsConfirmation": boolean
}
      `;

      const response = await openai.chat.completions.create({
        model: AI_CONFIG.models.chat,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Voice command analysis failed:', error);
      return this.getBasicCommandAnalysis(transcript);
    }
  }

  private static getBasicCommandAnalysis(transcript: string) {
    const command = transcript.toLowerCase();
    
    if (command.includes('emergency') || command.includes('help')) {
      return {
        intent: { primary: 'emergency', confidence: 0.9 },
        actions: [{ type: 'emergency_alert', priority: 'critical', data: {} }],
        response: 'Emergency alert will be sent to your group',
        needsConfirmation: true
      };
    }

    if (command.includes('location') || command.includes('where')) {
      return {
        intent: { primary: 'location', confidence: 0.8 },
        actions: [{ type: 'send_location', priority: 'medium', data: {} }],
        response: 'Sharing your current location',
        needsConfirmation: false
      };
    }

    return {
      intent: { primary: 'unknown', confidence: 0.3 },
      actions: [],
      response: 'Command not recognized',
      needsConfirmation: false
    };
  }

  // Text-to-speech with natural voice
  static async speak(text: string, options: { 
    voice?: string; 
    rate?: number; 
    pitch?: number; 
    volume?: number;
    useOpenAI?: boolean;
  } = {}) {
    if (options.useOpenAI && AI_CONFIG.enabled) {
      try {
        // Use OpenAI TTS for more natural voice
        const response = await openai.audio.speech.create({
          model: AI_CONFIG.models.tts,
          voice: 'alloy',
          input: text,
          speed: options.rate || 1.0
        });

        const audioBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBufferDecoded = await audioContext.decodeAudioData(audioBuffer);
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBufferDecoded;
        source.connect(audioContext.destination);
        source.start();

        return;
      } catch (error) {
        console.error('OpenAI TTS failed, falling back to browser TTS:', error);
      }
    }

    // Fallback to browser TTS
    if (!this.synthesis) {
      await this.initialize();
    }

    if (!this.synthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    // Try to use a more natural voice
    const voices = this.synthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.lang.includes('en-US')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.synthesis.speak(utterance);
  }

  // Convert audio to text using OpenAI Whisper
  static async transcribeAudio(audioBlob: Blob): Promise<string> {
    if (!AI_CONFIG.enabled) {
      throw new Error('OpenAI not configured for audio transcription');
    }

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', AI_CONFIG.models.stt);

      const response = await openai.audio.transcriptions.create({
        file: audioBlob,
        model: AI_CONFIG.models.stt,
        language: 'en'
      });

      return response.text;
    } catch (error) {
      console.error('Audio transcription failed:', error);
      throw error;
    }
  }
}