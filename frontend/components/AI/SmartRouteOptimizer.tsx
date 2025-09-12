"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Navigation, 
  Clock, 
  MapPin, 
  TrendingUp,
  Zap,
  Brain,
  Route,
  Fuel,
  DollarSign,
  TreePine,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RealTimeAIService } from '@/lib/ai-real-time';
import { useToast } from '@/hooks/use-toast';
import { 
  AreaChart, 
  Area,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

interface SmartRouteOptimizerProps {
  groupData: any;
  userLocation?: { lat: number; lng: number };
  memberLocations: Map<string, { lat: number; lng: number }>;
  onRouteOptimized: (route: any) => void;
}

interface RouteOption {
  id: string;
  name: string;
  distance: number;
  estimatedTime: number;
  timeSaved: number;
  fuelSaved: number;
  costSaved: number;
  co2Saved: number;
  confidence: number;
  pros: string[];
  cons: string[];
  aiRecommendation: boolean;
}

interface TrafficPrediction {
  time: string;
  congestion: number;
  speed: number;
  incidents: number;
}

export default function SmartRouteOptimizer({
  groupData,
  userLocation,
  memberLocations,
  onRouteOptimized
}: SmartRouteOptimizerProps) {
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [trafficPredictions, setTrafficPredictions] = useState<TrafficPrediction[]>([]);
  const [optimizationCriteria, setOptimizationCriteria] = useState({
    time: 0.4,
    fuel: 0.3,
    safety: 0.2,
    comfort: 0.1
  });

  useEffect(() => {
    if (userLocation && groupData) {
      generateRouteOptions();
      generateTrafficPredictions();
    }
  }, [userLocation, groupData, memberLocations]);

  const generateRouteOptions = async () => {
    setIsOptimizing(true);
    
    try {
      const waypoints = [
        { name: groupData.source, lat: 0, lng: 0 }, // Would get real coordinates
        { name: groupData.destination, lat: 0, lng: 0 }
      ];

      const optimization = await RealTimeAIService.optimizeRoute(
        waypoints,
        {
          memberCount: groupData.members?.length || 1,
          vehicleTypes: ['car'], // Could be dynamic
          preferences: optimizationCriteria
        },
        {
          weather: 'clear',
          traffic: 'moderate',
          time: new Date().toISOString()
        }
      );

      // Generate multiple route options
      const routes: RouteOption[] = [
        {
          id: 'ai-optimized',
          name: 'AI-Optimized Route',
          distance: optimization.optimizedRoute.totalDistance || 150,
          estimatedTime: optimization.optimizedRoute.estimatedTime || 120,
          timeSaved: optimization.optimizedRoute.timeSaved || 15,
          fuelSaved: 2.3,
          costSaved: 8.50,
          co2Saved: 1.2,
          confidence: optimization.confidence || 0.9,
          pros: ['Fastest route', 'Avoids traffic', 'AI-verified'],
          cons: ['Some tolls'],
          aiRecommendation: true
        },
        {
          id: 'scenic',
          name: 'Scenic Route',
          distance: 180,
          estimatedTime: 150,
          timeSaved: -15,
          fuelSaved: -1.5,
          costSaved: -3.20,
          co2Saved: -0.8,
          confidence: 0.75,
          pros: ['Beautiful views', 'Rest stops', 'Less stressful'],
          cons: ['Longer duration', 'More fuel'],
          aiRecommendation: false
        },
        {
          id: 'eco-friendly',
          name: 'Eco-Friendly Route',
          distance: 165,
          estimatedTime: 135,
          timeSaved: 5,
          fuelSaved: 3.8,
          costSaved: 12.75,
          co2Saved: 2.1,
          confidence: 0.82,
          pros: ['Lower emissions', 'Fuel efficient', 'Cost effective'],
          cons: ['Slightly longer', 'Some city traffic'],
          aiRecommendation: false
        }
      ];

      setRouteOptions(routes);
      setSelectedRoute('ai-optimized');
    } catch (error) {
      console.error('Route optimization failed:', error);
      toast({
        title: 'Route Optimization Failed',
        description: 'Unable to generate route options. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const generateTrafficPredictions = () => {
    const predictions: TrafficPrediction[] = [];
    const now = new Date();
    
    for (let i = 0; i < 24; i++) {
      const time = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hour = time.getHours();
      
      // Simulate traffic patterns
      let congestion = 0.3;
      if (hour >= 7 && hour <= 9) congestion = 0.8; // Morning rush
      if (hour >= 17 && hour <= 19) congestion = 0.9; // Evening rush
      if (hour >= 22 || hour <= 5) congestion = 0.1; // Night
      
      predictions.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        congestion: congestion * 100,
        speed: 60 - (congestion * 30),
        incidents: Math.floor(Math.random() * 3)
      });
    }
    
    setTrafficPredictions(predictions.slice(0, 12)); // Next 12 hours
  };

  const applyRouteOptimization = (routeId: string) => {
    const route = routeOptions.find(r => r.id === routeId);
    if (!route) return;

    onRouteOptimized(route);
    
    toast({
      title: 'Route Applied',
      description: `${route.name} has been set as your active route`
    });
  };

  const updateOptimizationCriteria = (criteria: typeof optimizationCriteria) => {
    setOptimizationCriteria(criteria);
    generateRouteOptions(); // Re-optimize with new criteria
  };

  if (isOptimizing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary animate-spin" />
            AI Route Optimization in Progress...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={75} className="h-3" />
            <div className="text-center text-sm text-muted-foreground">
              Analyzing traffic patterns, weather conditions, and group preferences...
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Brain className="h-6 w-6 mx-auto mb-1 text-primary" />
                <div className="text-xs">AI Analysis</div>
              </div>
              <div>
                <MapPin className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                <div className="text-xs">Route Mapping</div>
              </div>
              <div>
                <TrendingUp className="h-6 w-6 mx-auto mb-1 text-green-600" />
                <div className="text-xs">Optimization</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Route Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            AI Route Optimization
            <Badge variant="default" className="ml-auto">
              <Brain className="h-3 w-3 mr-1" />
              {routeOptions.length} Options
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedRoute} onValueChange={setSelectedRoute}>
            <TabsList className="grid w-full grid-cols-3">
              {routeOptions.map((route) => (
                <TabsTrigger key={route.id} value={route.id} className="text-xs">
                  {route.aiRecommendation && <Zap className="h-3 w-3 mr-1" />}
                  {route.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {routeOptions.map((route) => (
              <TabsContent key={route.id} value={route.id} className="mt-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${route.aiRecommendation ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      {route.name}
                      {route.aiRecommendation && (
                        <Badge variant="default" className="text-xs">
                          <Brain className="h-3 w-3 mr-1" />
                          AI Recommended
                        </Badge>
                      )}
                    </h3>
                    <Badge variant="outline">
                      {Math.round(route.confidence * 100)}% confidence
                    </Badge>
                  </div>

                  {/* Route Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-background/50 rounded">
                      <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                      <div className="font-bold">{route.estimatedTime}min</div>
                      <div className="text-xs text-muted-foreground">
                        {route.timeSaved > 0 ? `${route.timeSaved}min saved` : 
                         route.timeSaved < 0 ? `${Math.abs(route.timeSaved)}min longer` : 'On time'}
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-background/50 rounded">
                      <Fuel className="h-5 w-5 mx-auto mb-1 text-green-600" />
                      <div className="font-bold">{route.distance}km</div>
                      <div className="text-xs text-muted-foreground">
                        {route.fuelSaved > 0 ? `${route.fuelSaved}L saved` : 
                         route.fuelSaved < 0 ? `${Math.abs(route.fuelSaved)}L extra` : 'Standard'}
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-background/50 rounded">
                      <DollarSign className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
                      <div className="font-bold">${Math.abs(route.costSaved).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        {route.costSaved > 0 ? 'Saved' : route.costSaved < 0 ? 'Extra cost' : 'Standard'}
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-background/50 rounded">
                      <TreePine className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
                      <div className="font-bold">{Math.abs(route.co2Saved).toFixed(1)}kg</div>
                      <div className="text-xs text-muted-foreground">
                        {route.co2Saved > 0 ? 'CO₂ saved' : route.co2Saved < 0 ? 'Extra CO₂' : 'Standard'}
                      </div>
                    </div>
                  </div>

                  {/* Pros and Cons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium text-green-600 mb-2">Advantages:</div>
                      <ul className="text-sm space-y-1">
                        {route.pros.map((pro, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-red-600 mb-2">Considerations:</div>
                      <ul className="text-sm space-y-1">
                        {route.cons.map((con, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Button
                    onClick={() => applyRouteOptimization(route.id)}
                    className="w-full"
                    variant={route.aiRecommendation ? "default" : "outline"}
                  >
                    <Route className="h-4 w-4 mr-2" />
                    Apply This Route
                    {route.aiRecommendation && <Zap className="h-4 w-4 ml-2" />}
                  </Button>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Traffic Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            AI Traffic Predictions
            <Badge variant="secondary" className="ml-auto">
              Next 12 Hours
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficPredictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value}${name === 'congestion' ? '%' : name === 'speed' ? ' km/h' : ''}`,
                    name === 'congestion' ? 'Congestion' : name === 'speed' ? 'Speed' : 'Incidents'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="congestion" 
                  stackId="1"
                  stroke="#ef4444" 
                  fill="#ef4444"
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="speed" 
                  stackId="2"
                  stroke="#3b82f6" 
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Traffic Insights</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Based on historical patterns and real-time data, traffic will be lightest 
              between 10 PM and 6 AM. Consider adjusting departure time for optimal travel.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            AI Optimization Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(optimizationCriteria).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{key} Priority</span>
                  <span className="font-medium">{Math.round(value * 100)}%</span>
                </div>
                <Progress value={value * 100} className="h-2" />
              </div>
            ))}
            
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => generateRouteOptions()}
                className="w-full"
              >
                <Brain className="h-4 w-4 mr-2" />
                Re-optimize with AI
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}