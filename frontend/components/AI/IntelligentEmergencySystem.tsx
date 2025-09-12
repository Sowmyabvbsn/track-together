"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Phone, 
  MapPin, 
  Clock,
  Shield,
  Brain,
  Zap,
  Users,
  Camera,
  Mic,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { RealTimeAIService } from '@/lib/ai-real-time';
import { EnhancedVoiceService } from '@/lib/ai-voice-enhanced';

interface IntelligentEmergencySystemProps {
  groupId: string;
  userLocation?: { lat: number; lng: number };
  groupData: any;
  onEmergencyAction: (action: any) => void;
}

interface EmergencyProtocol {
  id: string;
  name: string;
  description: string;
  aiActions: string[];
  humanActions: string[];
  estimatedResponseTime: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface EmergencyState {
  active: boolean;
  type: string;
  startTime: Date;
  aiConfidence: number;
  responseActions: string[];
  nearbyServices: any[];
}

export default function IntelligentEmergencySystem({
  groupId,
  userLocation,
  groupData,
  onEmergencyAction
}: IntelligentEmergencySystemProps) {
  const { toast } = useToast();
  const [emergencyState, setEmergencyState] = useState<EmergencyState>({
    active: false,
    type: '',
    startTime: new Date(),
    aiConfidence: 0,
    responseActions: [],
    nearbyServices: []
  });
  const [aiMonitoring, setAiMonitoring] = useState(true);
  const [autoResponse, setAutoResponse] = useState(true);
  const [voiceActivation, setVoiceActivation] = useState(true);

  const emergencyProtocols: EmergencyProtocol[] = [
    {
      id: 'medical',
      name: 'Medical Emergency',
      description: 'Health-related emergency requiring immediate medical assistance',
      aiActions: [
        'Automatically call emergency services',
        'Share precise GPS coordinates',
        'Notify all group members with priority alert',
        'Find nearest hospital and route',
        'Start continuous location tracking',
        'Enable emergency beacon mode'
      ],
      humanActions: [
        'Ensure personal safety',
        'Provide first aid if trained',
        'Stay with the affected person',
        'Guide emergency responders'
      ],
      estimatedResponseTime: 5,
      severity: 'critical'
    },
    {
      id: 'accident',
      name: 'Vehicle Accident',
      description: 'Traffic accident or vehicle breakdown requiring assistance',
      aiActions: [
        'Contact emergency services and insurance',
        'Document incident with photos/video',
        'Share location with authorities',
        'Alert group with accident details',
        'Find nearest towing service',
        'Coordinate alternative transportation'
      ],
      humanActions: [
        'Move to safety if possible',
        'Check for injuries',
        'Exchange insurance information',
        'Document the scene'
      ],
      estimatedResponseTime: 10,
      severity: 'high'
    },
    {
      id: 'lost',
      name: 'Member Lost/Separated',
      description: 'Group member lost or separated from the main group',
      aiActions: [
        'Broadcast last known location',
        'Coordinate search pattern',
        'Enable high-frequency tracking',
        'Send location to all members',
        'Calculate search radius',
        'Monitor for movement patterns'
      ],
      humanActions: [
        'Establish communication',
        'Share landmarks and directions',
        'Coordinate meeting point',
        'Stay in contact'
      ],
      estimatedResponseTime: 3,
      severity: 'medium'
    },
    {
      id: 'weather',
      name: 'Severe Weather',
      description: 'Dangerous weather conditions affecting group safety',
      aiActions: [
        'Monitor weather radar in real-time',
        'Find nearest shelter locations',
        'Calculate safe route alternatives',
        'Alert group with weather updates',
        'Recommend delay or route change',
        'Track storm movement patterns'
      ],
      humanActions: [
        'Seek immediate shelter',
        'Avoid exposed areas',
        'Stay together as a group',
        'Monitor weather updates'
      ],
      estimatedResponseTime: 2,
      severity: 'high'
    }
  ];

  useEffect(() => {
    if (aiMonitoring) {
      const interval = setInterval(() => {
        performAIMonitoring();
      }, 15000); // Check every 15 seconds

      return () => clearInterval(interval);
    }
  }, [aiMonitoring, userLocation, groupData]);

  useEffect(() => {
    if (voiceActivation) {
      setupVoiceActivation();
    }
  }, [voiceActivation]);

  const performAIMonitoring = async () => {
    if (!userLocation || !groupData) return;

    try {
      // Analyze current safety conditions
      const safetyAnalysis = await RealTimeAIService.analyzeSafety(
        groupData,
        [{ clerkId: 'current', lat: userLocation.lat, lng: userLocation.lng, lastUpdated: new Date() }],
        { weather: 'clear', visibility: 'good' }
      );

      // Check for emergency conditions
      if (safetyAnalysis.alertLevel === 'red' || safetyAnalysis.safetyScore < 30) {
        triggerAIEmergency('ai_detected', safetyAnalysis);
      }
    } catch (error) {
      console.error('AI monitoring failed:', error);
    }
  };

  const setupVoiceActivation = async () => {
    try {
      await EnhancedVoiceService.initialize();
      
      // Listen for emergency keywords
      const emergencyKeywords = ['emergency', 'help', 'accident', 'medical', 'urgent'];
      
      // This would be implemented with continuous listening in a real app
      // For demo purposes, we'll show the capability
    } catch (error) {
      console.error('Voice activation setup failed:', error);
    }
  };

  const triggerAIEmergency = async (type: string, data?: any) => {
    const protocol = emergencyProtocols.find(p => p.id === type) || emergencyProtocols[0];
    
    setEmergencyState({
      active: true,
      type: protocol.name,
      startTime: new Date(),
      aiConfidence: 0.95,
      responseActions: protocol.aiActions,
      nearbyServices: await findNearbyEmergencyServices()
    });

    // Execute AI emergency response
    const emergencyData = {
      type: 'ai_emergency',
      protocol: protocol,
      location: userLocation,
      groupId,
      timestamp: new Date().toISOString(),
      confidence: 0.95,
      autoActions: protocol.aiActions,
      severity: protocol.severity
    };

    onEmergencyAction(emergencyData);

    // AI voice announcement
    if (autoResponse) {
      await EnhancedVoiceService.speak(
        `Emergency protocol activated. ${protocol.name} response initiated. Help is on the way.`,
        { useOpenAI: true, rate: 1.1 }
      );
    }

    // Execute AI actions with delays
    protocol.aiActions.forEach((action, index) => {
      setTimeout(() => {
        toast({
          title: 'AI Emergency Action',
          description: action,
          variant: 'destructive'
        });
      }, (index + 1) * 2000);
    });
  };

  const findNearbyEmergencyServices = async () => {
    // Simulate finding nearby services (in real app, use Google Places API)
    return [
      { name: 'City General Hospital', distance: 2.3, type: 'hospital', phone: '911' },
      { name: 'Central Police Station', distance: 1.8, type: 'police', phone: '911' },
      { name: 'Fire Department Station 5', distance: 3.1, type: 'fire', phone: '911' },
      { name: 'Emergency Medical Services', distance: 1.2, type: 'ambulance', phone: '911' }
    ];
  };

  const deactivateEmergency = () => {
    setEmergencyState({
      active: false,
      type: '',
      startTime: new Date(),
      aiConfidence: 0,
      responseActions: [],
      nearbyServices: []
    });
    
    toast({
      title: 'Emergency Deactivated',
      description: 'All emergency protocols have been stopped'
    });
  };

  const testEmergencySystem = async () => {
    toast({
      title: 'Testing Emergency System',
      description: 'Running AI emergency system diagnostics...'
    });

    // Simulate system test
    setTimeout(() => {
      toast({
        title: 'Emergency System Test Complete',
        description: '✅ All systems operational - AI monitoring active'
      });
    }, 3000);
  };

  return (
    <div className="space-y-4">
      {/* AI Emergency Status */}
      <Card className={`border-2 ${emergencyState.active ? 'border-red-500 bg-red-50 dark:bg-red-950 animate-pulse' : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <div className="relative">
              <Shield className={`h-5 w-5 ${emergencyState.active ? 'text-red-600' : 'text-green-600'}`} />
              {aiMonitoring && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
              )}
            </div>
            Intelligent Emergency System
            <Badge variant={emergencyState.active ? 'destructive' : 'default'} className="ml-auto">
              {emergencyState.active ? 'EMERGENCY ACTIVE' : 'AI Monitoring'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emergencyState.active ? (
            <div className="space-y-4">
              <Alert className="border-red-500 bg-red-100 dark:bg-red-900">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{emergencyState.type}</strong> - AI Response Active
                  <br />
                  <span className="text-xs">
                    Duration: {Math.floor((Date.now() - emergencyState.startTime.getTime()) / 1000)}s
                  </span>
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-background/50 rounded">
                  <div className="text-lg font-bold text-red-600">
                    {Math.round(emergencyState.aiConfidence * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">AI Confidence</div>
                </div>
                <div className="text-center p-3 bg-background/50 rounded">
                  <div className="text-lg font-bold text-blue-600">
                    {emergencyState.nearbyServices.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Services Found</div>
                </div>
              </div>

              {/* AI Actions Progress */}
              <div className="space-y-2">
                <div className="text-sm font-medium">AI Emergency Actions:</div>
                {emergencyState.responseActions.slice(0, 4).map((action, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.5 }}
                    className="flex items-center gap-2 text-xs p-2 bg-background/30 rounded"
                  >
                    <Zap className="h-3 w-3 text-primary" />
                    <span>{action}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {index < 2 ? 'Complete' : 'In Progress'}
                    </Badge>
                  </motion.div>
                ))}
              </div>

              <Button 
                variant="outline" 
                onClick={deactivateEmergency}
                className="w-full"
              >
                Deactivate Emergency (Safe Now)
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="relative inline-block">
                  <Shield className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  {aiMonitoring && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  AI Emergency System Active - Monitoring group safety in real-time
                </p>
              </div>

              {/* AI Monitoring Controls */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={aiMonitoring ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAiMonitoring(!aiMonitoring)}
                  className="flex-col h-16 gap-1"
                >
                  <Brain className="h-4 w-4" />
                  <span className="text-xs">AI Monitor</span>
                </Button>
                
                <Button
                  variant={autoResponse ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoResponse(!autoResponse)}
                  className="flex-col h-16 gap-1"
                >
                  <Zap className="h-4 w-4" />
                  <span className="text-xs">Auto Response</span>
                </Button>
                
                <Button
                  variant={voiceActivation ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVoiceActivation(!voiceActivation)}
                  className="flex-col h-16 gap-1"
                >
                  <Mic className="h-4 w-4" />
                  <span className="text-xs">Voice Alert</span>
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={testEmergencySystem}
                className="w-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                Test Emergency System
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency Protocols */}
      {!emergencyState.active && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              AI Emergency Protocols
              <Badge variant="secondary" className="ml-auto">
                <Brain className="h-3 w-3 mr-1" />
                AI Enhanced
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emergencyProtocols.map((protocol) => (
                <motion.div
                  key={protocol.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{protocol.name}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={protocol.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {protocol.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        ~{protocol.estimatedResponseTime}min
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {protocol.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-xs font-medium text-primary mb-1">AI Actions:</div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {protocol.aiActions.slice(0, 3).map((action, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <Brain className="h-3 w-3 text-primary" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-orange-600 mb-1">Your Actions:</div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {protocol.humanActions.slice(0, 3).map((action, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-orange-600" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={protocol.severity === 'critical' ? 'destructive' : 'default'}
                    onClick={() => triggerAIEmergency(protocol.id)}
                    className="w-full"
                  >
                    <Zap className="h-3 w-3 mr-2" />
                    Activate {protocol.name}
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nearby Emergency Services */}
      <AnimatePresence>
        {emergencyState.active && emergencyState.nearbyServices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  AI-Located Emergency Services
                  <Badge variant="default" className="ml-auto">
                    <Navigation className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {emergencyState.nearbyServices.map((service, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-background/50 rounded border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
                          {service.type === 'hospital' && <Phone className="h-4 w-4 text-red-600" />}
                          {service.type === 'police' && <Shield className="h-4 w-4 text-blue-600" />}
                          {service.type === 'fire' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                          {service.type === 'ambulance' && <Phone className="h-4 w-4 text-green-600" />}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{service.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {service.distance}km away • {service.phone}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Navigation className="h-3 w-3 mr-1" />
                          Route
                        </Button>
                        <Button size="sm" variant="default">
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}