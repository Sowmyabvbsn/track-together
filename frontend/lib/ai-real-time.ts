import { openai, AI_CONFIG } from './openai-client';

export class RealTimeAIService {
  private static analysisCache = new Map<string, any>();
  private static lastAnalysis = new Map<string, number>();

  // Real-time group dynamics analysis
  static async analyzeGroupDynamics(groupData: any, messages: any[], locations: any[]) {
    if (!AI_CONFIG.enabled) {
      return this.getMockAnalysis();
    }

    const cacheKey = `dynamics-${groupData._id}-${messages.length}`;
    const lastUpdate = this.lastAnalysis.get(cacheKey) || 0;
    
    // Cache for 30 seconds to avoid excessive API calls
    if (Date.now() - lastUpdate < 30000 && this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    try {
      const recentMessages = messages.slice(-20).map(m => 
        `${m.senderName}: ${m.content}`
      ).join('\n');

      const locationSummary = locations.map(loc => 
        `Member ${loc.clerkId}: ${loc.lat?.toFixed(4)}, ${loc.lng?.toFixed(4)}`
      ).join('\n');

      const prompt = `
Analyze this group ride coordination data and provide actionable insights:

GROUP INFO:
- Name: ${groupData.name}
- Members: ${groupData.members?.length || 0}
- Route: ${groupData.source} → ${groupData.destination}
- Start: ${new Date(groupData.startTime).toLocaleString()}

RECENT COMMUNICATION (last 20 messages):
${recentMessages || 'No recent messages'}

CURRENT LOCATIONS:
${locationSummary || 'No location data'}

Provide analysis in JSON format with:
{
  "coordinationScore": number (0-100),
  "communicationEfficiency": number (0-100),
  "riskFactors": string[],
  "recommendations": string[],
  "predictions": {
    "arrivalAccuracy": number (0-1),
    "delayProbability": number (0-1),
    "groupCohesion": number (0-1)
  },
  "insights": string[],
  "urgentActions": string[]
}

Focus on practical, actionable insights for group coordination.
      `;

      const response = await openai.chat.completions.create({
        model: AI_CONFIG.models.chat,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      // Cache the result
      this.analysisCache.set(cacheKey, analysis);
      this.lastAnalysis.set(cacheKey, Date.now());
      
      return analysis;
    } catch (error) {
      console.error('Real-time AI analysis failed:', error);
      return this.getMockAnalysis();
    }
  }

  // Intelligent message processing with sentiment and intent
  static async processMessage(message: string, context: any) {
    if (!AI_CONFIG.enabled) {
      return this.getMockMessageAnalysis(message);
    }

    try {
      const prompt = `
Analyze this group ride message for sentiment, intent, and generate smart responses:

MESSAGE: "${message}"
CONTEXT: Group "${context.groupName}" with ${context.memberCount} members

Provide analysis in JSON format:
{
  "sentiment": {
    "primary": "positive|negative|neutral|urgent",
    "confidence": number (0-1),
    "emotions": string[]
  },
  "intent": {
    "primary": "location_request|eta_query|emergency|arrival|delay|casual",
    "confidence": number (0-1),
    "actions": string[]
  },
  "urgency": number (0-1),
  "smartReplies": string[],
  "suggestedActions": string[],
  "translation": string|null,
  "summary": string
}
      `;

      const response = await openai.chat.completions.create({
        model: AI_CONFIG.models.chat,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Message processing failed:', error);
      return this.getMockMessageAnalysis(message);
    }
  }

  // Advanced route optimization with real-time data
  static async optimizeRoute(waypoints: any[], groupContext: any, realTimeData: any) {
    if (!AI_CONFIG.enabled) {
      return this.getMockRouteOptimization();
    }

    try {
      const prompt = `
Optimize this group ride route considering real-time conditions:

WAYPOINTS:
${waypoints.map((wp, i) => `${i + 1}. ${wp.name}: ${wp.lat}, ${wp.lng}`).join('\n')}

GROUP CONTEXT:
- Size: ${groupContext.memberCount} people
- Vehicle types: ${groupContext.vehicleTypes || 'Mixed'}
- Preferences: ${groupContext.preferences || 'Fastest route'}

REAL-TIME DATA:
- Current time: ${new Date().toLocaleString()}
- Weather: ${realTimeData.weather || 'Clear'}
- Traffic: ${realTimeData.traffic || 'Moderate'}

Provide optimization in JSON format:
{
  "optimizedRoute": {
    "waypoints": [{"lat": number, "lng": number, "name": string}],
    "totalDistance": number,
    "estimatedTime": number,
    "timeSaved": number
  },
  "alternatives": [
    {
      "name": string,
      "timeDiff": number,
      "distanceDiff": number,
      "pros": string[],
      "cons": string[]
    }
  ],
  "trafficInsights": {
    "currentConditions": string,
    "predictedConditions": string,
    "recommendations": string[]
  },
  "confidence": number (0-1),
  "reasoning": string
}
      `;

      const response = await openai.chat.completions.create({
        model: AI_CONFIG.models.chat,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1200,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Route optimization failed:', error);
      return this.getMockRouteOptimization();
    }
  }

  // Predictive safety analysis
  static async analyzeSafety(groupData: any, locationData: any[], environmentData: any) {
    if (!AI_CONFIG.enabled) {
      return this.getMockSafetyAnalysis();
    }

    try {
      const prompt = `
Analyze safety conditions for this group ride:

GROUP DATA:
- Members: ${groupData.members?.length || 0}
- Route: ${groupData.source} → ${groupData.destination}
- Time: ${new Date().toLocaleString()}

LOCATION DATA:
${locationData.map(loc => 
  `Member ${loc.clerkId}: ${loc.lat}, ${loc.lng} (last update: ${new Date(loc.lastUpdated).toLocaleString()})`
).join('\n')}

ENVIRONMENT:
- Weather: ${environmentData.weather || 'Unknown'}
- Time of day: ${new Date().getHours()}:${new Date().getMinutes()}
- Visibility: ${environmentData.visibility || 'Good'}

Provide safety analysis in JSON format:
{
  "safetyScore": number (0-100),
  "riskFactors": [
    {
      "type": string,
      "severity": "low|medium|high|critical",
      "description": string,
      "recommendations": string[]
    }
  ],
  "predictions": {
    "incidentProbability": number (0-1),
    "delayRisk": number (0-1),
    "weatherImpact": number (0-1)
  },
  "recommendations": string[],
  "emergencyContacts": string[],
  "alertLevel": "green|yellow|orange|red"
}
      `;

      const response = await openai.chat.completions.create({
        model: AI_CONFIG.models.chat,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Safety analysis failed:', error);
      return this.getMockSafetyAnalysis();
    }
  }

  // Generate contextual smart replies
  static async generateSmartReplies(message: string, groupContext: any, conversationHistory: any[]) {
    if (!AI_CONFIG.enabled) {
      return this.getMockSmartReplies();
    }

    try {
      const recentHistory = conversationHistory.slice(-10).map(msg => 
        `${msg.senderName}: ${msg.content}`
      ).join('\n');

      const prompt = `
Generate smart reply suggestions for this group ride message:

INCOMING MESSAGE: "${message}"
GROUP: ${groupContext.groupName} (${groupContext.memberCount} members)
RECENT CONVERSATION:
${recentHistory}

Generate 3-5 contextually appropriate replies in JSON format:
{
  "replies": [
    {
      "text": string,
      "type": "quick|detailed|action",
      "confidence": number (0-1),
      "tone": "casual|formal|urgent"
    }
  ],
  "suggestedActions": [
    {
      "action": "share_location|share_eta|call_member|emergency",
      "description": string,
      "priority": "low|medium|high"
    }
  ]
}

Make replies natural, helpful, and appropriate for group coordination.
      `;

      const response = await openai.chat.completions.create({
        model: AI_CONFIG.models.chat,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 600,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Smart replies generation failed:', error);
      return this.getMockSmartReplies();
    }
  }

  // Predictive ETA calculation
  static async calculatePredictiveETA(userLocation: any, destination: any, groupData: any) {
    if (!AI_CONFIG.enabled) {
      return this.getMockETACalculation();
    }

    try {
      const prompt = `
Calculate predictive ETA considering multiple factors:

CURRENT LOCATION: ${userLocation.lat}, ${userLocation.lng}
DESTINATION: ${destination.name} (${destination.lat}, ${destination.lng})
TIME: ${new Date().toLocaleString()}
GROUP SIZE: ${groupData.members?.length || 1}

FACTORS TO CONSIDER:
- Current traffic conditions
- Historical travel patterns
- Weather conditions
- Time of day
- Group coordination delays
- Rest stop requirements

Provide ETA analysis in JSON format:
{
  "eta": {
    "estimatedArrival": string (ISO datetime),
    "travelTime": number (minutes),
    "confidence": number (0-1)
  },
  "factors": {
    "traffic": number (0-1),
    "weather": number (0-1),
    "groupDelay": number (0-1)
  },
  "alternatives": [
    {
      "route": string,
      "eta": string,
      "probability": number
    }
  ],
  "recommendations": string[]
}
      `;

      const response = await openai.chat.completions.create({
        model: AI_CONFIG.models.chat,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('ETA calculation failed:', error);
      return this.getMockETACalculation();
    }
  }

  // Mock responses for when OpenAI is not available
  private static getMockAnalysis() {
    return {
      coordinationScore: 75 + Math.random() * 20,
      communicationEfficiency: 80 + Math.random() * 15,
      riskFactors: ['traffic congestion', 'weather conditions'],
      recommendations: ['Increase communication frequency', 'Share location updates'],
      predictions: {
        arrivalAccuracy: 0.85 + Math.random() * 0.1,
        delayProbability: 0.1 + Math.random() * 0.2,
        groupCohesion: 0.8 + Math.random() * 0.15
      },
      insights: ['Group communication is active', 'Members are well-coordinated'],
      urgentActions: []
    };
  }

  private static getMockMessageAnalysis(message: string) {
    return {
      sentiment: {
        primary: 'neutral',
        confidence: 0.8,
        emotions: ['neutral']
      },
      intent: {
        primary: 'casual',
        confidence: 0.7,
        actions: []
      },
      urgency: 0.3,
      smartReplies: ['Thanks for the update!', 'Got it!', 'On my way'],
      suggestedActions: [],
      translation: null,
      summary: 'Casual group message'
    };
  }

  private static getMockRouteOptimization() {
    return {
      optimizedRoute: {
        waypoints: [],
        totalDistance: 150,
        estimatedTime: 120,
        timeSaved: 15
      },
      alternatives: [
        {
          name: 'Highway Route',
          timeDiff: -10,
          distanceDiff: 5,
          pros: ['Faster', 'Less traffic'],
          cons: ['Tolls required']
        }
      ],
      trafficInsights: {
        currentConditions: 'Moderate traffic',
        predictedConditions: 'Light traffic in 30 minutes',
        recommendations: ['Consider leaving 15 minutes later']
      },
      confidence: 0.85,
      reasoning: 'Route optimized based on current traffic patterns'
    };
  }

  private static getMockSafetyAnalysis() {
    return {
      safetyScore: 85,
      riskFactors: [],
      predictions: {
        incidentProbability: 0.05,
        delayRisk: 0.15,
        weatherImpact: 0.1
      },
      recommendations: ['Maintain current safety protocols'],
      emergencyContacts: ['911', 'Local Emergency Services'],
      alertLevel: 'green'
    };
  }

  private static getMockSmartReplies() {
    return {
      replies: [
        { text: 'Thanks for the update!', type: 'quick', confidence: 0.9, tone: 'casual' },
        { text: 'Got it, see you soon!', type: 'quick', confidence: 0.8, tone: 'casual' },
        { text: 'Let me know if you need anything', type: 'detailed', confidence: 0.7, tone: 'helpful' }
      ],
      suggestedActions: []
    };
  }

  private static getMockETACalculation() {
    return {
      eta: {
        estimatedArrival: new Date(Date.now() + 3600000).toISOString(),
        travelTime: 60,
        confidence: 0.85
      },
      factors: {
        traffic: 0.3,
        weather: 0.1,
        groupDelay: 0.2
      },
      alternatives: [
        { route: 'Highway', eta: new Date(Date.now() + 3300000).toISOString(), probability: 0.8 }
      ],
      recommendations: ['Leave 10 minutes earlier to account for group coordination']
    };
  }
}