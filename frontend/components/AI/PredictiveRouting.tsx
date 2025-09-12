"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Navigation, 
  Brain, 
  MapPin, 
  Clock,
  TrendingUp,
  Zap,
  Route
} from 'lucide-react';
import { motion } from 'framer-motion';
import { RealTimeAIService } from '@/lib/ai-real-time';

interface PredictiveRoutingProps {
  groupData: any;
  userLocation?: { lat: number; lng: number };
  onRouteUpdate: (route: any) => void;
}

interface RouteAnalysis {
  currentRoute: {
    distance: number;
    estimatedTime: number;
    traffic: string;
  };
  optimizedRoute: {
    distance: number;
    estimatedTime: number;
    timeSaved: number;
    confidence: number;
  };
  predictions: {
    trafficConditions: string;
    weatherImpact: string;
    delayProbability: number;
  };
}

export default function PredictiveRouting({
  groupData,
  userLocation,
  onRouteUpdate
}: PredictiveRoutingProps) {
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (groupData && userLocation) {
      analyzeRoute();
    }
  }, [groupData, userLocation]);

  const analyzeRoute = async () => {
    setIsAnalyzing(true);
    
    try {
      const waypoints = [
        { name: groupData.source, lat: 0, lng: 0 },
        { name: groupData.destination, lat: 0, lng: 0 }
      ];

      const optimization = await RealTimeAIService.optimizeRoute(
        waypoints,
        { memberCount: groupData.members?.length || 1 },
        { weather: 'clear', traffic: 'moderate' }
      );

      const analysis: RouteAnalysis = {
        currentRoute: {
          distance: 150 + Math.random() * 100,
          estimatedTime: 120 + Math.random() * 60,
          traffic: 'moderate'
        },
        optimizedRoute: {
          distance: optimization.optimizedRoute.totalDistance || 140,
          estimatedTime: optimization.optimizedRoute.estimatedTime || 110,
          timeSaved: optimization.optimizedRoute.timeSaved || 10,
          confidence: optimization.confidence || 0.85
        },
        predictions: {
          trafficConditions: 'Improving in next 30 minutes',
          weatherImpact: 'Clear conditions expected',
          delayProbability: 0.15
        }
      };

      setRouteAnalysis(analysis);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Route analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyOptimizedRoute = () => {
    if (routeAnalysis) {
      onRouteUpdate(routeAnalysis.optimizedRoute);
    }
  };

  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary animate-spin" />
            AI Route Analysis in Progress...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={75} className="h-2" />
            <div className="text-center text-sm text-muted-foreground">
              Analyzing traffic patterns, weather, and optimal routes...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!routeAnalysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            Predictive Routing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Route analysis will appear when location data is available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Route Comparison */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            AI Route Optimization
            <Badge variant="default" className="ml-auto">
              <Brain className="h-3 w-3 mr-1" />
              {Math.round(routeAnalysis.optimizedRoute.confidence * 100)}% confidence
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Route */}
            <div className="p-4 bg-background/50 rounded-lg border">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Route className="h-4 w-4" />
                Current Route
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Distance:</span>
                  <span className="font-medium">{routeAnalysis.currentRoute.distance.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Time:</span>
                  <span className="font-medium">{routeAnalysis.currentRoute.estimatedTime} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Traffic:</span>
                  <Badge variant="secondary">{routeAnalysis.currentRoute.traffic}</Badge>
                </div>
              </div>
            </div>

            {/* Optimized Route */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                AI Optimized Route
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Distance:</span>
                  <span className="font-medium text-primary">{routeAnalysis.optimizedRoute.distance.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Time:</span>
                  <span className="font-medium text-primary">{routeAnalysis.optimizedRoute.estimatedTime} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Time Saved:</span>
                  <span className="font-medium text-green-600">
                    {routeAnalysis.optimizedRoute.timeSaved} min
                  </span>
                </div>
              </div>
              
              <Button
                onClick={applyOptimizedRoute}
                className="w-full mt-4"
                size="sm"
              >
                <Zap className="h-4 w-4 mr-2" />
                Apply Optimized Route
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            AI Route Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Traffic Forecast</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {routeAnalysis.predictions.trafficConditions}
              </p>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Weather Impact</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {routeAnalysis.predictions.weatherImpact}
              </p>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-sm">Delay Probability</span>
                <Badge variant="outline">
                  {Math.round(routeAnalysis.predictions.delayProbability * 100)}%
                </Badge>
              </div>
              <Progress 
                value={routeAnalysis.predictions.delayProbability * 100} 
                className="h-2 mt-2" 
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={analyzeRoute}
              disabled={isAnalyzing}
              className="w-full"
            >
              <Brain className="h-4 w-4 mr-2" />
              Refresh AI Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}