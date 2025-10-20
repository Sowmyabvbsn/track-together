'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Navigation,
  AlertTriangle,
  TrendingUp,
  Clock,
  Fuel,
  MapPin,
  Route,
  RefreshCw,
  Zap,
  Shield,
  Info
} from 'lucide-react';
import { hereAPIClient, isHereAPIConfigured, type Coordinates, type Waypoint, type OptimizedRoute, type TrafficIncident } from '@/lib/here-api-client';
import { groqClient } from '@/lib/groq-client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface AIRouteOptimizerProps {
  origin: Coordinates;
  destination: Coordinates;
  waypoints?: Waypoint[];
  onRouteSelected?: (route: OptimizedRoute) => void;
}

interface AIAnalysis {
  recommendation: string;
  reasoning: string;
  safetyConcerns: string[];
  timeEstimate: string;
  suggestions: string[];
}

export default function AIRouteOptimizer({
  origin,
  destination,
  waypoints = [],
  onRouteSelected,
}: AIRouteOptimizerProps) {
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<OptimizedRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<OptimizedRoute | null>(null);
  const [trafficIncidents, setTrafficIncidents] = useState<TrafficIncident[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [options, setOptions] = useState({
    avoidTraffic: true,
    avoidTolls: false,
    avoidHighways: false,
    mode: 'fastest' as 'fastest' | 'shortest' | 'balanced',
  });

  const optimizeRoute = async () => {
    setLoading(true);
    setAiAnalysis(null);

    try {
      const result = await hereAPIClient.optimizeRoute(
        origin,
        destination,
        waypoints,
        {
          mode: options.mode,
          avoidTraffic: options.avoidTraffic,
          avoidTolls: options.avoidTolls,
          avoidHighways: options.avoidHighways,
          alternatives: 3,
        }
      );

      setRoutes(result.routes);
      setTrafficIncidents(result.trafficIncidents);

      if (result.routes.length > 0) {
        setSelectedRoute(result.routes[0]);
        onRouteSelected?.(result.routes[0]);
        await analyzeWithAI(result.routes, result.trafficIncidents);
      }
    } catch (error) {
      console.error('Route optimization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeWithAI = async (
    routes: OptimizedRoute[],
    incidents: TrafficIncident[]
  ) => {
    setAnalyzing(true);

    try {
      const routeData = routes.slice(0, 3).map((route, index) => ({
        routeNumber: index + 1,
        duration: hereAPIClient.formatDuration(route.summary.duration),
        distance: hereAPIClient.formatDistance(route.summary.length),
        trafficDelay: hereAPIClient.formatDuration(
          route.summary.duration - route.summary.baseDuration
        ),
      }));

      const incidentSummary = incidents.map(inc => ({
        type: inc.incidentDetails?.type || 'Unknown',
        severity: inc.incidentDetails?.severity || 'Unknown',
        description: inc.incidentDetails?.description || 'No details',
      }));

      const prompt = `You are a smart route optimization AI assistant. Analyze these routes and provide recommendations.

Routes Available:
${routeData
  .map(
    (r) =>
      `Route ${r.routeNumber}: ${r.distance}, ${r.duration} (Traffic delay: ${r.trafficDelay})`
  )
  .join('\n')}

Traffic Incidents on Routes:
${incidentSummary.length > 0
  ? incidentSummary.map((i) => `- ${i.type} (${i.severity}): ${i.description}`).join('\n')
  : 'No major incidents detected'}

Current Time: ${new Date().toLocaleTimeString()}

Provide a JSON response with this structure:
{
  "recommendation": "Brief recommendation (1-2 sentences)",
  "reasoning": "Explain why this route is best (2-3 sentences)",
  "safetyConcerns": ["list", "of", "safety", "concerns"],
  "timeEstimate": "Estimated arrival summary",
  "suggestions": ["helpful", "suggestions", "for", "the", "journey"]
}`;

      const response = await groqClient.generate(prompt);

      try {
        const jsonMatch = response.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          setAiAnalysis(analysis);
        } else {
          setAiAnalysis({
            recommendation: response.response.split('\n')[0],
            reasoning: 'AI analysis completed based on route data.',
            safetyConcerns: incidents.length > 0 ? ['Traffic incidents detected on route'] : [],
            timeEstimate: `Estimated arrival: ${new Date(Date.now() + routes[0].summary.duration * 1000).toLocaleTimeString()}`,
            suggestions: ['Check traffic before leaving', 'Keep phone charged for navigation'],
          });
        }
      } catch (parseError) {
        console.error('AI response parse error:', parseError);
        setAiAnalysis({
          recommendation: 'Route 1 is recommended as the fastest option.',
          reasoning: 'Based on current traffic conditions and route analysis.',
          safetyConcerns: incidents.length > 0 ? ['Traffic incidents detected'] : [],
          timeEstimate: `Estimated arrival: ${new Date(Date.now() + routes[0].summary.duration * 1000).toLocaleTimeString()}`,
          suggestions: ['Monitor traffic updates', 'Plan for buffer time'],
        });
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      setAiAnalysis({
        recommendation: 'Route analysis completed. Route 1 recommended.',
        reasoning: 'Unable to complete AI analysis. Using fastest route.',
        safetyConcerns: [],
        timeEstimate: 'Check map for arrival time',
        suggestions: ['Enable real-time traffic updates'],
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRouteSelect = (route: OptimizedRoute) => {
    setSelectedRoute(route);
    onRouteSelected?.(route);
  };

  useEffect(() => {
    if (origin && destination) {
      optimizeRoute();
    }
  }, [origin, destination, waypoints]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI-Powered Route Optimization
          </CardTitle>
          <CardDescription>
            {isHereAPIConfigured()
              ? 'Real-time traffic analysis with HERE Maps + AI recommendations'
              : 'Using fallback routing (add HERE API key for real-time traffic)'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isHereAPIConfigured() && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Demo Mode:</strong> Add NEXT_PUBLIC_HERE_API_KEY for real-time traffic and advanced routing.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="avoid-traffic">Avoid Traffic</Label>
              <Switch
                id="avoid-traffic"
                checked={options.avoidTraffic}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, avoidTraffic: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="avoid-tolls">Avoid Tolls</Label>
              <Switch
                id="avoid-tolls"
                checked={options.avoidTolls}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, avoidTolls: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="avoid-highways">Avoid Highways</Label>
              <Switch
                id="avoid-highways"
                checked={options.avoidHighways}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, avoidHighways: checked })
                }
              />
            </div>
          </div>

          <div className="flex gap-2">
            {(['fastest', 'shortest', 'balanced'] as const).map((mode) => (
              <Button
                key={mode}
                variant={options.mode === mode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOptions({ ...options, mode })}
                className="flex-1"
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
          </div>

          <Button
            onClick={optimizeRoute}
            disabled={loading}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Optimizing...' : 'Reoptimize Route'}
          </Button>

          {loading && (
            <div className="space-y-2">
              <Progress value={66} />
              <p className="text-xs text-center text-muted-foreground">
                Analyzing traffic and calculating optimal routes...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {aiAnalysis && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              AI Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium text-lg">{aiAnalysis.recommendation}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {aiAnalysis.reasoning}
              </p>
            </div>

            {aiAnalysis.safetyConcerns.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Safety Alerts:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {aiAnalysis.safetyConcerns.map((concern, index) => (
                      <li key={index}>{concern}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{aiAnalysis.timeEstimate}</span>
              </div>
            </div>

            {aiAnalysis.suggestions.length > 0 && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-2">Suggestions:</p>
                <ul className="text-sm space-y-1">
                  {aiAnalysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {routes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Available Routes ({routes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {routes.map((route, index) => (
              <div
                key={route.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedRoute?.id === route.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleRouteSelect(route)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? 'default' : 'secondary'}>
                      Route {index + 1}
                    </Badge>
                    {index === 0 && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Recommended
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {hereAPIClient.formatDuration(route.summary.duration)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        +{hereAPIClient.formatDuration(
                          route.summary.duration - route.summary.baseDuration
                        )}{' '}
                        traffic
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {hereAPIClient.formatDistance(route.summary.length)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total distance</p>
                    </div>
                  </div>
                </div>

                {route.notices && route.notices.length > 0 && (
                  <div className="mt-3 flex items-start gap-2 text-xs">
                    <Shield className="h-3 w-3 text-yellow-600 mt-0.5" />
                    <p className="text-muted-foreground">
                      {route.notices[0].title}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {trafficIncidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Traffic Incidents ({trafficIncidents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {trafficIncidents.slice(0, 5).map((incident, index) => (
              <div
                key={incident.id || index}
                className="p-3 bg-muted rounded-lg text-sm"
              >
                <div className="flex items-start justify-between mb-1">
                  <Badge
                    variant={
                      incident.incidentDetails?.severity === 'critical'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {incident.incidentDetails?.type || 'Incident'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {incident.incidentDetails?.severity || 'Unknown'}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  {incident.incidentDetails?.description || 'Traffic incident reported'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {analyzing && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="font-medium">AI is analyzing routes...</p>
                <p className="text-sm text-muted-foreground">
                  Considering traffic, safety, and efficiency
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
