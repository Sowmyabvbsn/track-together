"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  Brain,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { GroupAnalytics } from '@/lib/ai-services';

interface PredictiveInsightsProps {
  groupData: any;
  userLocation?: { lat: number; lng: number };
  memberLocations: Map<string, { lat: number; lng: number }>;
}

interface Insight {
  id: string;
  type: 'pattern' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  icon: React.ReactNode;
}

export default function PredictiveInsights({ 
  groupData, 
  userLocation, 
  memberLocations 
}: PredictiveInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupScore, setGroupScore] = useState(0);

  useEffect(() => {
    generateInsights();
  }, [groupData, memberLocations]);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const newInsights: Insight[] = [];

      // Analyze group behavior
      const behaviorAnalysis = GroupAnalytics.analyzeGroupBehavior(groupData);
      
      // Calculate group score
      const memberCount = groupData.members?.length || 0;
      const score = Math.min(50 + (memberCount * 10), 100);
      setGroupScore(score);

      // Generate insights based on group size
      if (memberCount > 5) {
        newInsights.push({
          id: 'large-group',
          type: 'recommendation',
          title: 'Large Group Management',
          description: 'Consider using subgroups for better coordination',
          confidence: 0.8,
          priority: 'medium',
          icon: <Users className="h-4 w-4" />,
        });
      }

      // Group cohesion analysis
      if (memberLocations.size > 1) {
        const cohesionInsight = analyzeGroupCohesion(memberLocations);
        if (cohesionInsight) {
          newInsights.push(cohesionInsight);
        }
      }

      // Activity pattern insights
      newInsights.push({
        id: 'activity-pattern',
        type: 'pattern',
        title: 'Activity Pattern',
        description: `Group activity level is ${behaviorAnalysis.patterns.activityLevel}`,
        confidence: 0.75,
        priority: 'low',
        icon: <Activity className="h-4 w-4" />,
      });

      setInsights(newInsights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeGroupCohesion = (locations: Map<string, { lat: number; lng: number }>) => {
    const locationArray = Array.from(locations.values());
    let totalDistance = 0;
    let comparisons = 0;

    for (let i = 0; i < locationArray.length; i++) {
      for (let j = i + 1; j < locationArray.length; j++) {
        const distance = calculateDistance(
          locationArray[i].lat,
          locationArray[i].lng,
          locationArray[j].lat,
          locationArray[j].lng
        );
        totalDistance += distance;
        comparisons++;
      }
    }

    const averageDistance = totalDistance / comparisons;
    const cohesionLevel = averageDistance < 1000 ? 'high' : averageDistance < 5000 ? 'medium' : 'low';

    return {
      id: 'group-cohesion',
      type: 'pattern' as const,
      title: 'Group Cohesion',
      description: `Group cohesion is ${cohesionLevel} (avg distance: ${Math.round(averageDistance)}m)`,
      confidence: 0.9,
      priority: cohesionLevel === 'low' ? 'high' as const : 'medium' as const,
      icon: <Users className="h-4 w-4" />,
    };
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      case 'medium': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      case 'low': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      default: return 'border-border bg-card';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary animate-pulse" />
            Generating Insights...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Group Score */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Group Coordination Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Performance</span>
              <Badge variant={groupScore >= 80 ? 'default' : groupScore >= 60 ? 'secondary' : 'destructive'}>
                {groupScore}/100
              </Badge>
            </div>
            <Progress value={groupScore} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Based on group size, activity level, and coordination patterns
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Smart Insights
            <Badge variant="secondary" className="ml-auto">
              {insights.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No insights available yet.</p>
              <p className="text-sm">Insights will appear as your group becomes more active.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${getPriorityColor(insight.priority)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-background/50 p-2 rounded-full">
                      {insight.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {insight.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Confidence:</span>
                        <span className="text-xs font-medium text-primary">
                          {Math.round(insight.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}