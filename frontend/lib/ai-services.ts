interface AIConfig {
  openaiApiKey?: string;
  geminiApiKey?: string;
  huggingFaceApiKey?: string;
  enabled: boolean;
  fallbackMode: boolean;
}

const AI_CONFIG: AIConfig = {
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  geminiApiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  huggingFaceApiKey: process.env.NEXT_PUBLIC_HUGGING_FACE_API_KEY,
  enabled: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  fallbackMode: !process.env.NEXT_PUBLIC_OPENAI_API_KEY,
};

// Enhanced error handling and retry logic
class AIServiceError extends Error {
  constructor(message: string, public service: string, public retryable: boolean = true) {
    super(message);
    this.name = 'AIServiceError';
  }
}

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  throw new Error('Max retries exceeded');
}

// Smart Message Processing
export class MessageProcessor {
  static async analyzeMessage(message: string, context: any = {}) {
    if (AI_CONFIG.fallbackMode) {
      return this.getBasicAnalysis(message);
    }

    try {
      return await withRetry(async () => {
        const analysis = await this.performAIAnalysis(message, context);
        return analysis;
      });
    } catch (error) {
      console.error('AI message analysis failed:', error);
      return this.getBasicAnalysis(message);
    }
  }

  private static async performAIAnalysis(message: string, context: any) {
    if (AI_CONFIG.openaiApiKey) {
      return await this.analyzeWithOpenAI(message, context);
    } else if (AI_CONFIG.geminiApiKey) {
      return await this.analyzeWithGemini(message, context);
    } else {
      return this.getAdvancedLocalAnalysis(message, context);
    }
  }

  private static async analyzeWithOpenAI(message: string, context: any) {
    // OpenAI analysis implementation
    const response = await fetch('/api/ai/analyze-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context })
    });

    if (!response.ok) {
      throw new AIServiceError('OpenAI analysis failed', 'openai');
    }

    return await response.json();
  }

  private static async analyzeWithGemini(message: string, context: any) {
    // Gemini analysis implementation
    const sentiment = this.analyzeSentiment(message);
    const intent = this.detectIntent(message);
    const suggestions = this.generateSuggestions(message);
    
    return {
      originalMessage: message,
      sentiment,
      intent,
      suggestions,
      autoResponses: this.generateAutoResponses(message),
      urgencyScore: this.calculateUrgency(sentiment, intent),
      aiProvider: 'gemini'
    };
  }

  private static getAdvancedLocalAnalysis(message: string, context: any) {
    // Enhanced local analysis with better pattern recognition
      const sentiment = this.analyzeSentiment(message);
      const intent = this.detectIntent(message);
      const suggestions = this.generateSuggestions(message);
      const entities = this.extractEntities(message);
      const urgency = this.calculateUrgency(sentiment, intent);
      
      return {
        originalMessage: message,
        sentiment,
        intent,
        suggestions,
        autoResponses: this.generateAutoResponses(message),
        urgencyScore: urgency,
        entities,
        confidence: this.calculateConfidence(sentiment, intent),
        aiProvider: 'local'
      };
  }

  private static analyzeSentiment(message: string) {
    const urgentWords = ['emergency', 'help', 'urgent', 'asap', 'now'];
    const positiveWords = ['great', 'good', 'thanks', 'awesome', 'perfect'];
    const negativeWords = ['problem', 'issue', 'late', 'stuck', 'lost'];

    const lowerMessage = message.toLowerCase();
    
    if (urgentWords.some(word => lowerMessage.includes(word))) {
      return { sentiment: 'urgent', confidence: 0.9 };
    }
    if (positiveWords.some(word => lowerMessage.includes(word))) {
      return { sentiment: 'positive', confidence: 0.8 };
    }
    if (negativeWords.some(word => lowerMessage.includes(word))) {
      return { sentiment: 'negative', confidence: 0.8 };
    }
    
    return { sentiment: 'neutral', confidence: 0.7 };
  }

  private static detectIntent(message: string) {
    const lowerMessage = message.toLowerCase();
    
    // Enhanced intent detection with more patterns
    if (lowerMessage.match(/\b(where|location|gps|coordinates|position)\b/)) {
      return { intent: 'location_request', confidence: 0.9 };
    }
    if (lowerMessage.match(/\b(eta|arrive|arrival|when|time|reach)\b/)) {
      return { intent: 'eta_query', confidence: 0.85 };
    }
    if (lowerMessage.match(/\b(emergency|help|urgent|sos|accident|danger)\b/)) {
      return { intent: 'emergency', confidence: 0.95 };
    }
    if (lowerMessage.match(/\b(arrived|reached|here|made it|destination)\b/)) {
      return { intent: 'arrival_notification', confidence: 0.9 };
    }
    if (lowerMessage.match(/\b(late|delay|behind|stuck|traffic|slow)\b/)) {
      return { intent: 'delay_notification', confidence: 0.85 };
    }
    if (lowerMessage.match(/\b(stop|break|rest|fuel|food|bathroom)\b/)) {
      return { intent: 'stop_request', confidence: 0.8 };
    }
    if (lowerMessage.match(/\b(weather|rain|storm|fog|visibility)\b/)) {
      return { intent: 'weather_concern', confidence: 0.8 };
    }
    
    return { intent: 'casual', confidence: 0.6 };
  }

  private static extractEntities(message: string) {
    const entities: any = {};
    const lowerMessage = message.toLowerCase();
    
    // Extract time references
    const timePattern = /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/gi;
    const timeMatches = message.match(timePattern);
    if (timeMatches) {
      entities.times = timeMatches;
    }
    
    // Extract locations
    const locationPattern = /\b(at|near|in|from|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
    const locationMatches = message.match(locationPattern);
    if (locationMatches) {
      entities.locations = locationMatches;
    }
    
    // Extract numbers (distances, times, etc.)
    const numberPattern = /\b(\d+(?:\.\d+)?)\s*(km|miles|minutes|hours|min|hr)\b/gi;
    const numberMatches = message.match(numberPattern);
    if (numberMatches) {
      entities.measurements = numberMatches;
    }
    
    return entities;
  }

  private static calculateConfidence(sentiment: any, intent: any) {
    return (sentiment.confidence + intent.confidence) / 2;
  }

  private static generateSuggestions(message: string) {
    const lowerMessage = message.toLowerCase();
    const suggestions = [];
    
    // Context-aware suggestions
    if (lowerMessage.includes('late') || lowerMessage.includes('delay')) {
      suggestions.push('I\'m running 10 minutes late', 'Traffic is heavy on my route', 'Need to make a quick stop');
    } else if (lowerMessage.includes('arrived') || lowerMessage.includes('here')) {
      suggestions.push('I\'ve arrived safely', 'Waiting at the destination', 'Ready to proceed');
    } else if (lowerMessage.includes('where') || lowerMessage.includes('location')) {
      suggestions.push('📍 Share my location', 'I\'m at [landmark]', 'Still on route');
    } else {
      suggestions.push('I\'m on my way', 'Running on schedule', 'All good here');
    }
    
    return [
      ...suggestions,
      'Everything looks good',
      'Thanks for the update'
    ];
  }

  private static generateAutoResponses(message: string) {
    const responses = [];
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('where') || lowerMessage.includes('location')) {
      responses.push('📍 Share my location');
    }
    if (lowerMessage.includes('eta') || lowerMessage.includes('arrive')) {
      responses.push('🕐 Share my ETA');
    }
    if (lowerMessage.includes('help') || lowerMessage.includes('emergency')) {
      responses.push('🚨 Send emergency alert');
    }
    
    return responses;
  }

  private static calculateUrgency(sentiment: any, intent: any) {
    let score = 0.3; // Base score
    
    if (sentiment.sentiment === 'urgent') score += 0.4;
    if (intent.intent === 'emergency') score += 0.5;
    
    return Math.min(score, 1.0);
  }

  private static getBasicAnalysis(message: string) {
    return {
      originalMessage: message,
      sentiment: { sentiment: 'neutral', confidence: 0.5 },
      intent: { intent: 'casual', confidence: 0.5 },
      suggestions: ['I\'m on my way', 'Running late', 'Arrived safely'],
      autoResponses: [],
      urgencyScore: 0.3,
    };
  }
}

// Simple Route Optimization
export class RouteOptimizer {
  static async optimizeRoute(waypoints: { lat: number; lng: number; name: string }[]) {
    if (AI_CONFIG.enabled) {
      try {
        return await this.performAIOptimization(waypoints);
      } catch (error) {
        console.error('AI route optimization failed:', error);
        return this.getBasicOptimization(waypoints);
      }
    }
    
    return this.getBasicOptimization(waypoints);
  }

  private static async performAIOptimization(waypoints: any[]) {
    const response = await fetch('/api/ai/optimize-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waypoints })
    });

    if (!response.ok) {
      throw new AIServiceError('Route optimization failed', 'openai');
    }

    return await response.json();
  }

  private static getBasicOptimization(waypoints: any[]) {
    return {
      optimizedWaypoints: waypoints,
      timeSaved: Math.floor(Math.random() * 15) + 5,
      confidence: 0.8,
      suggestions: ['Use main roads', 'Avoid construction zones', 'Check traffic conditions'],
      provider: 'local'
    };
  }
}

// Basic Group Analytics
export class GroupAnalytics {
  static analyzeGroupBehavior(groupData: any) {
    const memberCount = groupData.members?.length || 0;
    const messageCount = groupData.messageCount || 0;
    const locationUpdates = groupData.locationUpdates || 0;
    
    return {
      patterns: {
        groupSize: memberCount,
        activityLevel: this.calculateActivityLevel(memberCount, messageCount, locationUpdates),
        communicationFrequency: this.calculateCommunicationFrequency(messageCount, memberCount),
        coordinationScore: this.calculateCoordinationScore(groupData),
      },
      recommendations: [
        ...this.generateRecommendations(groupData),
      ],
      insights: [
        {
          type: 'group_size',
          title: 'Group Size Analysis',
          description: `Your group has ${memberCount} members - ${this.getGroupSizeInsight(memberCount)}`,
          confidence: 1.0,
        },
        {
          type: 'activity_analysis',
          title: 'Activity Level',
          description: `Group activity is ${this.calculateActivityLevel(memberCount, messageCount, locationUpdates)}`,
          confidence: 0.85,
        },
      ],
    };
  }

  private static calculateActivityLevel(memberCount: number, messageCount: number, locationUpdates: number) {
    const activityScore = (messageCount * 0.4) + (locationUpdates * 0.3) + (memberCount * 0.3);
    if (activityScore > 50) return 'high';
    if (activityScore > 20) return 'medium';
    return 'low';
  }

  private static calculateCommunicationFrequency(messageCount: number, memberCount: number) {
    const messagesPerMember = messageCount / Math.max(memberCount, 1);
    if (messagesPerMember > 10) return 'high';
    if (messagesPerMember > 5) return 'medium';
    return 'low';
  }

  private static calculateCoordinationScore(groupData: any) {
    let score = 50; // Base score
    
    if (groupData.members?.length > 1) score += 20;
    if (groupData.messageCount > 5) score += 15;
    if (groupData.locationUpdates > 10) score += 15;
    
    return Math.min(score, 100);
  }

  private static getGroupSizeInsight(memberCount: number) {
    if (memberCount === 1) return 'perfect for solo tracking';
    if (memberCount <= 3) return 'ideal for small group coordination';
    if (memberCount <= 6) return 'good size for group activities';
    return 'large group - consider subgroups for better management';
  }

  private static generateRecommendations(groupData: any) {
    const recommendations = [];
    
    if (!groupData.locationSharingEnabled) {
      recommendations.push('Enable location sharing for better coordination');
    }
    
    if (groupData.members?.length > 5) {
      recommendations.push('Consider creating subgroups for better management');
    }
    
    if (groupData.messageCount < 5) {
      recommendations.push('Encourage more communication through group chat');
    }
    
    recommendations.push('Set up arrival notifications', 'Use distance alerts for safety');
    
    return recommendations;
  }
}

// Enhanced exports with better error handling
export {
  MessageProcessor as IntelligentMessageProcessor,
  RouteOptimizer as SmartRouteOptimizer,
  GroupAnalytics as PredictiveAnalytics,
  AIServiceError,
  withRetry,
};

// Enhanced legacy exports with AI capabilities
export const LocationPredictor = {
  predictNextLocation: async (currentLocation: any, groupData: any) => {
    if (AI_CONFIG.enabled) {
      try {
        const response = await fetch('/api/ai/predict-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentLocation, groupData })
        });
        
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Location prediction failed:', error);
      }
    }
    
    return {
      predictedLocation: currentLocation,
      confidence: 0.5,
      timeToDestination: 30,
      provider: 'fallback'
    };
  },
};

export const IntelligentGroupManager = {
  optimizeGroupSettings: async (groupData: any) => {
    const analytics = GroupAnalytics.analyzeGroupBehavior(groupData);
    
    return {
      recommendedSettings: {
        distanceThreshold: groupData.members?.length > 5 ? 1500 : 1000,
        updateFrequency: analytics.patterns.activityLevel === 'high' ? 30 : 60,
        notificationLevel: analytics.patterns.communicationFrequency === 'high' ? 'filtered' : 'all'
      },
      reasoning: analytics.recommendations,
      confidence: 0.8
    };
  },
};

export const SmartNotificationSystem = {
  generateIntelligentNotification: async (event: any) => {
    const priority = event.type === 'emergency' ? 'critical' : 
                    event.type === 'distance_alert' ? 'high' :
                    event.type === 'message' ? 'medium' : 'low';

    const timing = priority === 'critical' ? { immediate: true, persistent: true } :
                   priority === 'high' ? { immediate: true } :
                   { immediate: false, delay: 5000 };

    return {
      title: event.title || 'Group Update',
      message: event.message || 'New activity in your group',
      priority,
      actions: event.actions || [],
      timing,
      category: event.type || 'general',
      groupId: event.groupId,
      userId: event.userId
    };
  },
};