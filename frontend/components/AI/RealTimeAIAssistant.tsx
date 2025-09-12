"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Zap, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RealTimeAIService } from '@/lib/ai-real-time';

interface RealTimeAIAssistantProps {
  groupId: string;
  groupData: any;
  messages: any[];
  userLocation?: { lat: number; lng: number };
  onActionTrigger: (action: any) => void;
}

interface AIInsight {
  id: string;
  type: 'suggestion' | 'warning' | 'optimization' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  actions: string[];
  icon: React.ReactNode;
}

export default function RealTimeAIAssistant({
  groupId,
  groupData,
  messages,
  userLocation,
  onActionTrigger
}: RealTimeAIAssistantProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  useEffect(() => {
    if (groupData && messages.length > 0) {
      performRealTimeAnalysis();
    }
  }, [groupData, messages, userLocation]);

  const performRealTimeAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simulate analysis progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const locations = Array.from(userLocation ? [{ 
        clerkId: 'current', 
        lat: userLocation.lat, 
        lng: userLocation.lng, 
        lastUpdated: new Date() 
      }] : []);

      const analysis = await RealTimeAIService.analyzeGroupDynamics(
        groupData,
        messages,
        locations
      );

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      // Generate insights from analysis
      const newInsights = generateInsightsFromAnalysis(analysis);
      setInsights(newInsights);
      setLastAnalysis(new Date());

    } catch (error) {
      console.error('Real-time analysis failed:', error);
    } finally {
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisProgress(0);
      }, 500);
    }
  };

  const generateInsightsFromAnalysis = (analysis: any): AIInsight[] => {
    const insights: AIInsight[] = [];

    // Coordination insights
    if (analysis.coordinationScore < 70) {
      insights.push({
        id: 'coordination-low',
        type: 'warning',
        title: 'Low Coordination Score',
        description: `Group coordination is at ${Math.round(analysis.coordinationScore)}%. Consider increasing communication frequency.`,
        confidence: 0.85,
        priority: 'medium',
        actions: ['Increase check-ins', 'Share location more frequently'],
        icon: <Users className="h-4 w-4" />
      });
    }

    // Communication insights
    if (analysis.communicationEfficiency > 90) {
      insights.push({
        id: 'communication-excellent',
        type: 'suggestion',
        title: 'Excellent Communication',
        description: `Your group has ${Math.round(analysis.communicationEfficiency)}% communication efficiency. Great teamwork!`,
        confidence: 0.95,
        priority: 'low',
        actions: ['Maintain current practices'],
        icon: <CheckCircle className="h-4 w-4" />
      });
    }

    // Prediction insights
    if (analysis.predictions?.delayProbability > 0.3) {
      insights.push({
        id: 'delay-prediction',
        type: 'prediction',
        title: 'Potential Delay Detected',
        description: `AI predicts ${Math.round(analysis.predictions.delayProbability * 100)}% chance of delay. Consider leaving earlier.`,
        confidence: analysis.predictions.arrivalAccuracy || 0.8,
        priority: 'high',
        actions: ['Adjust departure time', 'Check traffic conditions'],
        icon: <Clock className="h-4 w-4" />
      });
    }

    // Risk factor insights
    if (analysis.riskFactors?.length > 0) {
      insights.push({
        id: 'risk-factors',
        type: 'warning',
        title: 'Risk Factors Identified',
        description: `AI detected: ${analysis.riskFactors.join(', ')}. Take necessary precautions.`,
        confidence: 0.8,
        priority: 'medium',
        actions: ['Monitor conditions', 'Stay alert'],
        icon: <AlertTriangle className="h-4 w-4" />
      });
    }

    return insights;
  };

  const executeAIAction = (insight: AIInsight, actionIndex: number) => {
    const action = {
      type: insight.type,
      title: insight.title,
      action: insight.actions[actionIndex],
      confidence: insight.confidence,
      groupId,
      timestamp: new Date().toISOString()
    };

    onActionTrigger(action);
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      case 'suggestion': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      case 'optimization': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
      case 'prediction': return 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950';
      default: return 'border-border bg-card';
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Analysis Status */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Brain className={`h-5 w-5 text-primary ${isAnalyzing ? 'animate-pulse' : ''}`} />
            Real-Time AI Assistant
            <Badge variant="default" className="ml-auto">
              <Activity className="h-3 w-3 mr-1" />
              {isAnalyzing ? 'Analyzing' : 'Active'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAnalyzing ? (
            <div className="space-y-3">
              <Progress value={analysisProgress} className="h-2" />
              <div className="text-center text-sm text-muted-foreground">
                AI is analyzing group dynamics and generating insights...
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{insights.length}</div>
                <div className="text-xs text-muted-foreground">Active Insights</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {insights.filter(i => i.type === 'suggestion').length}
                </div>
                <div className="text-xs text-muted-foreground">Suggestions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {lastAnalysis ? 'Live' : 'Pending'}
                </div>
                <div className="text-xs text-muted-foreground">Status</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            AI Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {insights.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
              >
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>AI is learning about your group...</p>
                <p className="text-sm">Insights will appear as data becomes available.</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-background/50 p-2 rounded-full">
                          {insight.icon}
                        </div>
                        <div>
                          <h4 className="font-medium">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                        </div>
                      </div>
                      <Badge variant={insight.priority === 'high' ? 'destructive' : 'secondary'}>
                        {insight.priority}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs text-muted-foreground">
                        Confidence: {Math.round(insight.confidence * 100)}%
                      </div>
                      <Progress value={insight.confidence * 100} className="w-24 h-1" />
                    </div>

                    {insight.actions.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium">Recommended Actions:</div>
                        <div className="flex flex-wrap gap-2">
                          {insight.actions.map((action, actionIndex) => (
                            <Button
                              key={actionIndex}
                              size="sm"
                              variant="outline"
                              onClick={() => executeAIAction(insight, actionIndex)}
                              className="text-xs h-7"
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              {action}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={performRealTimeAnalysis}
              disabled={isAnalyzing}
              className="w-full"
            >
              <Brain className="h-4 w-4 mr-2" />
              {isAnalyzing ? 'Analyzing...' : 'Refresh AI Analysis'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}