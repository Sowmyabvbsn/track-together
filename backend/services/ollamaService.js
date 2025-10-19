const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2';

class OllamaService {
  constructor() {
    this.baseUrl = OLLAMA_BASE_URL;
    this.model = OLLAMA_MODEL;
  }

  async chat(messages, options = {}) {
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
      return data.message?.content || '';
    } catch (error) {
      console.error('Ollama chat error:', error);
      throw error;
    }
  }

  async generate(prompt, options = {}) {
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
      return data.response || '';
    } catch (error) {
      console.error('Ollama generate error:', error);
      throw error;
    }
  }

  async analyzeLocationPattern(locationHistory, context = {}) {
    const prompt = `Analyze this location movement pattern and identify any safety concerns or unusual behavior:

Location History: ${JSON.stringify(locationHistory)}
Context: ${JSON.stringify(context)}

Provide analysis in JSON format with:
- riskLevel (low/medium/high/critical)
- concerns (array of specific concerns)
- recommendations (array of recommendations)
- deviationDetected (boolean)
- reasoning (brief explanation)`;

    const response = await this.generate(prompt, { temperature: 0.3 });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Failed to parse AI response, using fallback');
    }

    return this.fallbackLocationAnalysis(locationHistory, context);
  }

  async predictRoute(currentLocation, historicalData, groupContext) {
    const prompt = `Predict the likely destination and route based on:

Current Location: ${JSON.stringify(currentLocation)}
Historical Data: ${JSON.stringify(historicalData)}
Group Context: ${JSON.stringify(groupContext)}

Provide prediction in JSON format with:
- predictedDestination (lat, lng)
- confidence (0-1)
- estimatedArrivalTime (minutes)
- alternateRoutes (array)
- reasoning (brief explanation)`;

    const response = await this.generate(prompt, { temperature: 0.5 });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Failed to parse route prediction');
    }

    return this.fallbackRoutePrediction(currentLocation, groupContext);
  }

  async detectAnomalies(locationData, userProfile) {
    const prompt = `Detect anomalies in this location data:

Location Data: ${JSON.stringify(locationData)}
User Profile: ${JSON.stringify(userProfile)}

Identify:
1. Unusual speed or movement patterns
2. Deviations from expected routes
3. Extended stops in unexpected locations
4. Time-based anomalies

Return JSON with:
- anomaliesDetected (boolean)
- anomalyType (string or null)
- severity (low/medium/high/critical)
- details (array of specific anomalies)
- suggestedActions (array)`;

    const response = await this.generate(prompt, { temperature: 0.2 });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Failed to parse anomaly detection');
    }

    return this.fallbackAnomalyDetection(locationData);
  }

  async analyzeSafety(groupData, environmentData) {
    const prompt = `Analyze safety conditions for this group:

Group Data: ${JSON.stringify(groupData)}
Environment: ${JSON.stringify(environmentData)}

Consider:
- Time of day
- Location safety
- Group dispersion
- Movement patterns
- Historical incidents

Return JSON with:
- overallSafetyScore (0-100)
- risks (array of identified risks)
- alerts (array of immediate concerns)
- recommendations (array of safety suggestions)`;

    const response = await this.generate(prompt, { temperature: 0.3 });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Failed to parse safety analysis');
    }

    return this.fallbackSafetyAnalysis(groupData);
  }

  fallbackLocationAnalysis(locationHistory, context) {
    const recentLocations = locationHistory.slice(-5);
    const hasSignificantMovement = recentLocations.length > 1;

    return {
      riskLevel: 'low',
      concerns: [],
      recommendations: ['Continue monitoring location updates'],
      deviationDetected: false,
      reasoning: 'No concerning patterns detected in recent movement'
    };
  }

  fallbackRoutePrediction(currentLocation, groupContext) {
    return {
      predictedDestination: currentLocation,
      confidence: 0.5,
      estimatedArrivalTime: 30,
      alternateRoutes: [],
      reasoning: 'Insufficient data for accurate prediction'
    };
  }

  fallbackAnomalyDetection(locationData) {
    return {
      anomaliesDetected: false,
      anomalyType: null,
      severity: 'low',
      details: [],
      suggestedActions: ['Continue normal monitoring']
    };
  }

  fallbackSafetyAnalysis(groupData) {
    return {
      overallSafetyScore: 75,
      risks: [],
      alerts: [],
      recommendations: ['Enable location sharing', 'Set up check-in reminders']
    };
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export default new OllamaService();
