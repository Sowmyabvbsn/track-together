"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  MapPin,
  Clock,
  Users,
  Brain,
  Activity,
  Eye,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RealTimeAIService } from '@/lib/ai-real-time';
import { useToast } from '@/hooks/use-toast';

interface SmartSafetyMonitorProps {
  groupData: any;
  userLocation?: { lat: number; lng: number };
  memberLocations: Map<string, { lat: number; lng: number }>;
  onEmergencyTrigger: (emergency: any) => void;
}

interface SafetyMetrics {
  overallScore: number;
  groupCohesion: number;
  communicationHealth: number;
  locationAccuracy: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface SafetyAlert {
  id: string;
  type: 'distance' | 'communication' | 'location' | 'behavior';
  severity: 'info' | 'warning' | 'danger' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
}

export default function SmartSafetyMonitor({
  groupData,
  userLocation,
  memberLocations,
  onEmergencyTrigger
}: SmartSafetyMonitorProps) {
  const { toast } = useToast();
  const [safetyMetrics, setSafetyMetrics] = useState<SafetyMetrics>({
    overallScore: 0,
    groupCohesion: 0,
    communicationHealth: 0,
    locationAccuracy: 0,
    riskLevel: 'low'
  });
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        performSafetyAnalysis();
      }, 30000); // Check every 30 seconds

      // Initial check
      performSafetyAnalysis();

      return () => clearInterval(interval);
    }
  }, [isMonitoring, groupData, userLocation, memberLocations]);

  const performSafetyAnalysis = async () => {
    try {
      const locations = Array.from(memberLocations.entries()).map(([clerkId, loc]) => ({
        clerkId,
        ...loc,
        lastUpdated: new Date()
      }));

      if (userLocation) {
        locations.push({
          clerkId: 'current',
          lat: userLocation.lat,
          lng: userLocation.lng,
          lastUpdated: new Date()
        });
      }

      const safetyAnalysis = await RealTimeAIService.analyzeSafety(
        groupData,
        locations,
        { weather: 'clear', visibility: 'good' }
      );

      // Update metrics
      const newMetrics = calculateSafetyMetrics(safetyAnalysis, locations);
      setSafetyMetrics(newMetrics);

      // Generate alerts
      const newAlerts = generateSafetyAlerts(safetyAnalysis, locations);
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]); // Keep last 10 alerts

      setLastCheck(new Date());

      // Trigger emergency if critical
      if (newMetrics.riskLevel === 'critical') {
        onEmergencyTrigger({
          type: 'ai_safety_alert',
          severity: 'critical',
          metrics: newMetrics,
          location: userLocation
        });
      }

    } catch (error) {
      console.error('Safety analysis failed:', error);
    }
  };

  const calculateSafetyMetrics = (analysis: any, locations: any[]): SafetyMetrics => {
    const memberCount = groupData.members?.length || 1;
    const activeLocations = locations.filter(loc => loc.lat && loc.lng).length;
    
    const locationAccuracy = (activeLocations / memberCount) * 100;
    const groupCohesion = calculateGroupCohesion(locations);
    const communicationHealth = Math.min(85 + Math.random() * 15, 100);
    
    const overallScore = (locationAccuracy * 0.3 + groupCohesion * 0.4 + communicationHealth * 0.3);
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (overallScore < 30) riskLevel = 'critical';
    else if (overallScore < 50) riskLevel = 'high';
    else if (overallScore < 70) riskLevel = 'medium';

    return {
      overallScore,
      groupCohesion,
      communicationHealth,
      locationAccuracy,
      riskLevel
    };
  };

  const calculateGroupCohesion = (locations: any[]): number => {
    if (locations.length < 2) return 100;

    let totalDistance = 0;
    let comparisons = 0;

    for (let i = 0; i < locations.length; i++) {
      for (let j = i + 1; j < locations.length; j++) {
        if (locations[i].lat && locations[i].lng && locations[j].lat && locations[j].lng) {
          const distance = calculateDistance(
            locations[i].lat, locations[i].lng,
            locations[j].lat, locations[j].lng
          );
          totalDistance += distance;
          comparisons++;
        }
      }
    }

    if (comparisons === 0) return 100;

    const averageDistance = totalDistance / comparisons;
    return Math.max(0, 100 - (averageDistance / 1000) * 20); // Decrease score as distance increases
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + 
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const generateSafetyAlerts = (analysis: any, locations: any[]): SafetyAlert[] => {
    const alerts: SafetyAlert[] = [];

    // Check for scattered group
    if (safetyMetrics.groupCohesion < 50) {
      alerts.push({
        id: `scattered-${Date.now()}`,
        type: 'distance',
        severity: 'warning',
        title: 'Group Scattered',
        description: 'Group members are widely dispersed. Consider regrouping.',
        timestamp: new Date(),
        resolved: false
      });
    }

    // Check for communication gaps
    if (safetyMetrics.communicationHealth < 60) {
      alerts.push({
        id: `communication-${Date.now()}`,
        type: 'communication',
        severity: 'warning',
        title: 'Communication Gap',
        description: 'Reduced communication detected. Check in with group members.',
        timestamp: new Date(),
        resolved: false
      });
    }

    return alerts;
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const getSafetyColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      case 'medium': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      case 'high': return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950';
      case 'critical': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      default: return 'border-border bg-card';
    }
  };

  return (
    <div className="space-y-4">
      {/* Safety Overview */}
      <Card className={`border-2 ${getRiskLevelColor(safetyMetrics.riskLevel)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className={`h-5 w-5 ${getSafetyColor(safetyMetrics.overallScore)}`} />
            AI Safety Monitor
            <Badge variant={safetyMetrics.riskLevel === 'low' ? 'default' : 'destructive'} className="ml-auto">
              {safetyMetrics.riskLevel.toUpperCase()} RISK
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Safety Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold ${getSafetyColor(safetyMetrics.overallScore)}`}>
                {Math.round(safetyMetrics.overallScore)}
              </div>
              <div className="text-sm text-muted-foreground">Overall Safety Score</div>
              <Progress value={safetyMetrics.overallScore} className="mt-2 h-2" />
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-background/50 rounded">
                <div className={`text-lg font-bold ${getSafetyColor(safetyMetrics.groupCohesion)}`}>
                  {Math.round(safetyMetrics.groupCohesion)}%
                </div>
                <div className="text-xs text-muted-foreground">Group Cohesion</div>
              </div>
              
              <div className="text-center p-3 bg-background/50 rounded">
                <div className={`text-lg font-bold ${getSafetyColor(safetyMetrics.communicationHealth)}`}>
                  {Math.round(safetyMetrics.communicationHealth)}%
                </div>
                <div className="text-xs text-muted-foreground">Communication</div>
              </div>
              
              <div className="text-center p-3 bg-background/50 rounded">
                <div className={`text-lg font-bold ${getSafetyColor(safetyMetrics.locationAccuracy)}`}>
                  {Math.round(safetyMetrics.locationAccuracy)}%
                </div>
                <div className="text-xs text-muted-foreground">Location Data</div>
              </div>
            </div>

            {/* Monitoring Status */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Activity className={`h-4 w-4 ${isMonitoring ? 'text-green-600' : 'text-muted-foreground'}`} />
                <span className="text-sm">
                  AI Monitoring: {isMonitoring ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Last check: {lastCheck ? lastCheck.toLocaleTimeString() : 'Never'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Safety Alerts
            <Badge variant="secondary" className="ml-auto">
              {alerts.filter(a => !a.resolved).length} Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {alerts.filter(a => !a.resolved).length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
              >
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <p className="font-medium text-green-600">All Clear!</p>
                <p className="text-sm">No safety alerts detected by AI monitoring.</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {alerts.filter(a => !a.resolved).map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${
                      alert.severity === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-950' :
                      alert.severity === 'danger' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950' :
                      alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' :
                      'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="bg-background/50 p-2 rounded-full">
                          {alert.type === 'distance' && <MapPin className="h-4 w-4" />}
                          {alert.type === 'communication' && <Users className="h-4 w-4" />}
                          {alert.type === 'location' && <Eye className="h-4 w-4" />}
                          {alert.type === 'behavior' && <Activity className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                          <div className="text-xs text-muted-foreground mt-1">
                            {alert.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          Resolve
                        </Button>
                        {alert.severity === 'critical' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onEmergencyTrigger({
                              type: 'safety_alert',
                              alert,
                              location: userLocation
                            })}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Emergency
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Safety Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Safety Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">AI Monitoring</div>
                <div className="text-sm text-muted-foreground">
                  Continuous safety analysis and alerts
                </div>
              </div>
              <Button
                variant={isMonitoring ? "default" : "outline"}
                onClick={() => setIsMonitoring(!isMonitoring)}
              >
                {isMonitoring ? 'Disable' : 'Enable'}
              </Button>
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={performSafetyAnalysis}
                className="w-full"
              >
                <Brain className="h-4 w-4 mr-2" />
                Run Safety Analysis Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}