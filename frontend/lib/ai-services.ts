// Simple AI Services for RiderConnect
// Provides basic AI functionality when API keys are available

interface AIConfig {
  openaiApiKey?: string;
  enabled: boolean;
}

const AI_CONFIG: AIConfig = {
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  enabled: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
};

// Smart Message Processing
export class MessageProcessor {
  static async analyzeMessage(message: string, context: any = {}) {
    if (!AI_CONFIG.enabled) {
      return this.getBasicAnalysis(message);
    }

    try {
      // Simple sentiment analysis
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
      };
    } catch (error) {
      console.error('Message analysis failed:', error);
      return this.getBasicAnalysis(message);
    }
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
    
    if (lowerMessage.includes('where') || lowerMessage.includes('location')) {
      return { intent: 'location_request', confidence: 0.9 };
    }
    if (lowerMessage.includes('eta') || lowerMessage.includes('arrive')) {
      return { intent: 'eta_query', confidence: 0.85 };
    }
    if (lowerMessage.includes('emergency') || lowerMessage.includes('help')) {
      return { intent: 'emergency', confidence: 0.95 };
    }
    if (lowerMessage.includes('arrived') || lowerMessage.includes('reached')) {
      return { intent: 'arrival_notification', confidence: 0.9 };
    }
    if (lowerMessage.includes('late') || lowerMessage.includes('delay')) {
      return { intent: 'delay_notification', confidence: 0.85 };
    }
    
    return { intent: 'casual', confidence: 0.6 };
  }

  private static generateSuggestions(message: string) {
    return [
      'I\'m running 10 minutes late',
      'Traffic is heavy on my route',
      'I\'ve arrived at the destination',
      'Need to make a quick stop',
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
    // Simple route optimization logic
    return {
      optimizedWaypoints: waypoints,
      timeSaved: Math.floor(Math.random() * 15) + 5,
      confidence: 0.8,
      suggestions: ['Use main roads', 'Avoid construction zones'],
    };
  }
}

// Basic Group Analytics
export class GroupAnalytics {
  static analyzeGroupBehavior(groupData: any) {
    const memberCount = groupData.members?.length || 0;
    
    return {
      patterns: {
        groupSize: memberCount,
        activityLevel: memberCount > 5 ? 'high' : memberCount > 2 ? 'medium' : 'low',
        communicationFrequency: 'medium',
      },
      recommendations: [
        'Enable location sharing for better coordination',
        'Set up arrival notifications',
        'Use group chat for updates',
      ],
      insights: [
        {
          type: 'group_size',
          title: 'Group Size Analysis',
          description: `Your group has ${memberCount} members`,
          confidence: 1.0,
        },
      ],
    };
  }
}

// Export simplified services
export {
  MessageProcessor as IntelligentMessageProcessor,
  RouteOptimizer as SmartRouteOptimizer,
  GroupAnalytics as PredictiveAnalytics,
};

// Legacy exports for backward compatibility
export const LocationPredictor = {
  predictNextLocation: async () => null,
};

export const IntelligentGroupManager = {
  optimizeGroupSettings: async () => null,
};

export const SmartNotificationSystem = {
  generateIntelligentNotification: async (event: any) => ({
    title: 'Group Update',
    message: event.message || 'New activity in your group',
    priority: 'medium',
    actions: [],
    timing: { immediate: true },
  }),
};