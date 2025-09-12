import { openai, AI_CONFIG } from './openai-client';

export class EnhancedVisionService {
  // Analyze traffic conditions from camera feed
  static async analyzeTrafficConditions(imageData: string, location?: { lat: number; lng: number }) {
    if (!AI_CONFIG.enabled) {
      return this.getMockTrafficAnalysis();
    }

    try {
      const prompt = `
Analyze this traffic image for group ride coordination:

${location ? `LOCATION: ${location.lat}, ${location.lng}` : ''}
TIME: ${new Date().toLocaleString()}

Provide detailed traffic analysis in JSON format:
{
  "trafficDensity": "light|moderate|heavy|severe",
  "vehicleCount": number,
  "averageSpeed": number,
  "congestionLevel": number (0-1),
  "estimatedDelay": number (minutes),
  "roadConditions": {
    "visibility": "excellent|good|fair|poor",
    "roadSurface": "dry|wet|icy|construction",
    "weather": string
  },
  "recommendations": string[],
  "alternativeRoutes": string[],
  "safetyAlerts": string[],
  "confidence": number (0-1)
}

Focus on actionable insights for group travel coordination.
      `;

      const response = await openai.chat.completions.create({
        model: AI_CONFIG.models.vision,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageData } }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.2
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Traffic analysis failed:', error);
      return this.getMockTrafficAnalysis();
    }
  }

  // Analyze location safety from images
  static async analyzeLocationSafety(imageData: string, location: { lat: number; lng: number }) {
    if (!AI_CONFIG.enabled) {
      return this.getMockSafetyAnalysis();
    }

    try {
      const prompt = `
Analyze this location image for safety assessment:

COORDINATES: ${location.lat}, ${location.lng}
TIME: ${new Date().toLocaleString()}

Provide comprehensive safety analysis in JSON format:
{
  "safetyScore": number (0-100),
  "riskFactors": [
    {
      "type": "lighting|traffic|infrastructure|weather|crowd",
      "severity": "low|medium|high|critical",
      "description": string
    }
  ],
  "recommendations": string[],
  "emergencyServices": {
    "nearbyHospital": boolean,
    "policeStation": boolean,
    "fireStation": boolean
  },
  "accessibility": {
    "wheelchairAccessible": boolean,
    "publicTransport": boolean,
    "parking": boolean
  },
  "timeOfDayConsiderations": string[],
  "groupSuitability": number (0-1),
  "confidence": number (0-1)
}
      `;

      const response = await openai.chat.completions.create({
        model: AI_CONFIG.models.vision,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageData } }
            ]
          }
        ],
        max_tokens: 1200,
        temperature: 0.1
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Safety analysis failed:', error);
      return this.getMockSafetyAnalysis();
    }
  }

  // Analyze group photos for sentiment and engagement
  static async analyzeGroupPhoto(imageData: string, groupContext: any) {
    if (!AI_CONFIG.enabled) {
      return this.getMockPhotoAnalysis();
    }

    try {
      const prompt = `
Analyze this group photo for sentiment and engagement:

GROUP CONTEXT: ${groupContext.groupName} with ${groupContext.memberCount} members

Provide analysis in JSON format:
{
  "groupMood": "excited|happy|neutral|tired|stressed",
  "engagementLevel": number (0-1),
  "memberCount": number,
  "activities": string[],
  "location": {
    "type": "indoor|outdoor|vehicle|restaurant|landmark",
    "description": string
  },
  "recommendations": string[],
  "captionSuggestions": string[],
  "safetyObservations": string[],
  "confidence": number (0-1)
}
      `;

      const response = await openai.chat.completions.create({
        model: AI_CONFIG.models.vision,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageData } }
            ]
          }
        ],
        max_tokens: 800,
        temperature: 0.4
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Photo analysis failed:', error);
      return this.getMockPhotoAnalysis();
    }
  }

  // Real-time object detection for safety
  static async detectObjects(imageData: string) {
    if (!AI_CONFIG.enabled) {
      return this.getMockObjectDetection();
    }

    try {
      const prompt = `
Detect and analyze objects in this image for group travel safety:

Identify in JSON format:
{
  "vehicles": [
    {
      "type": "car|truck|motorcycle|bus",
      "position": string,
      "movement": "stationary|moving|approaching",
      "riskLevel": "low|medium|high"
    }
  ],
  "people": {
    "count": number,
    "groupMembers": number,
    "strangers": number,
    "activities": string[]
  },
  "infrastructure": {
    "roads": string[],
    "buildings": string[],
    "signage": string[],
    "lighting": "excellent|good|poor|none"
  },
  "hazards": string[],
  "safetyScore": number (0-100),
  "recommendations": string[]
}
      `;

      const response = await openai.chat.completions.create({
        model: AI_CONFIG.models.vision,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageData } }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.2
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Object detection failed:', error);
      return this.getMockObjectDetection();
    }
  }

  private static getMockTrafficAnalysis() {
    return {
      trafficDensity: 'moderate',
      vehicleCount: 25,
      averageSpeed: 45,
      congestionLevel: 0.4,
      estimatedDelay: 8,
      roadConditions: {
        visibility: 'good',
        roadSurface: 'dry',
        weather: 'clear'
      },
      recommendations: ['Maintain current route', 'Monitor for changes'],
      alternativeRoutes: ['Highway bypass available'],
      safetyAlerts: [],
      confidence: 0.85
    };
  }

  private static getMockSafetyAnalysis() {
    return {
      safetyScore: 88,
      riskFactors: [],
      recommendations: ['Well-lit area', 'Good visibility', 'Safe for group gathering'],
      emergencyServices: {
        nearbyHospital: true,
        policeStation: true,
        fireStation: false
      },
      accessibility: {
        wheelchairAccessible: true,
        publicTransport: true,
        parking: true
      },
      timeOfDayConsiderations: ['Good lighting available'],
      groupSuitability: 0.9,
      confidence: 0.82
    };
  }

  private static getMockPhotoAnalysis() {
    return {
      groupMood: 'happy',
      engagementLevel: 0.85,
      memberCount: 4,
      activities: ['socializing', 'taking photos'],
      location: {
        type: 'outdoor',
        description: 'Scenic viewpoint or rest area'
      },
      recommendations: ['Great spot for group photos', 'Consider sharing this moment'],
      captionSuggestions: ['Amazing views with the crew!', 'Group ride memories 📸'],
      safetyObservations: ['Safe environment', 'Good visibility'],
      confidence: 0.78
    };
  }

  private static getMockObjectDetection() {
    return {
      vehicles: [
        { type: 'car', position: 'left', movement: 'stationary', riskLevel: 'low' }
      ],
      people: {
        count: 3,
        groupMembers: 3,
        strangers: 0,
        activities: ['standing', 'talking']
      },
      infrastructure: {
        roads: ['paved road'],
        buildings: ['rest area'],
        signage: ['traffic signs'],
        lighting: 'good'
      },
      hazards: [],
      safetyScore: 92,
      recommendations: ['Safe area for group gathering']
    };
  }
}