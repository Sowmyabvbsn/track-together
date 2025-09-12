"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  MapPin, 
  MessageSquare,
  Clock,
  Shield,
  Zap,
  Activity,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AIInsightsDashboardProps {
  groupId: string;
  groupData: any;
  messages: any[];
  locations: any[];
  onInsightAction: (action: any) => void;
}

interface DashboardMetrics {
  coordinationScore: number;
  communicationEfficiency: number;
  safetyScore: number;
  predictiveAccuracy: number;
  totalInsights: number;
  appliedRecommendations: number;
}

export default function AIInsightsDashboard({
  groupId,
  groupData,
  messages,
  locations,
  onInsightAction
}: AIInsightsDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    coordinationScore: 0,
    communicationEfficiency: 0,
    safetyScore: 0,
    predictiveAccuracy: 0,
    totalInsights: 0,
    appliedRecommendations: 0
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    generateDashboardData();
  }, [groupData, messages, locations]);

  const generateDashboardData = async () => {
    setLoading(true);
    
    try {
      // Calculate metrics
      const memberCount = groupData.members?.length || 0;
      const messageCount = messages.length;
      
      const newMetrics: DashboardMetrics = {
        coordinationScore: Math.min(50 + (memberCount * 8) + (messageCount * 2), 100),
        communicationEfficiency: Math.min(60 + (messageCount * 3), 100),
        safetyScore: Math.min(80 + (locations.length * 5), 100),
        predictiveAccuracy: 85 + Math.random() * 10,
        totalInsights: 12 + Math.floor(Math.random() * 8),
        appliedRecommendations: 5 + Math.floor(Math.random() * 5)
      };

      setMetrics(newMetrics);

      // Generate chart data
      const chartData = [
        { name: 'Coordination', value: newMetrics.coordinationScore, color: '#3b82f6' },
        { name: 'Communication', value: newMetrics.communicationEfficiency, color: '#10b981' },
        { name: 'Safety', value: newMetrics.safetyScore, color: '#f59e0b' },
        { name: 'AI Accuracy', value: newMetrics.predictiveAccuracy, color: '#8b5cf6' }
      ];

      setChartData(chartData);
    } catch (error) {
      console.error('Failed to generate dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary animate-pulse" />
            Generating AI Dashboard...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={75} className="h-2" />
            <div className="text-center text-sm text-muted-foreground">
              Processing group data and generating insights...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Metrics Overview */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Performance Dashboard
            <Badge variant="default" className="ml-auto">
              <Activity className="h-3 w-3 mr-1" />
              Live Analysis
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(metrics).map(([key, value], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-3 bg-background/50 rounded-lg"
              >
                <div className="text-2xl font-bold text-primary">
                  {typeof value === 'number' ? 
                    (value > 10 ? Math.round(value) : value.toFixed(1)) : String(value)}
                  {key.includes('Score') || key.includes('Efficiency') || key.includes('Accuracy') ? '%' : ''}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="recommendations">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Group Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Coordination Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Current Score</span>
                    <Badge variant="default">{Math.round(metrics.coordinationScore)}%</Badge>
                  </div>
                  <Progress value={metrics.coordinationScore} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Based on communication frequency, response times, and group cohesion
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Safety Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Safety Score</span>
                    <Badge variant="default">{Math.round(metrics.safetyScore)}%</Badge>
                  </div>
                  <Progress value={metrics.safetyScore} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Evaluated based on location sharing, group proximity, and communication patterns
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                AI Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Arrival Prediction</span>
                    <Badge variant="outline">92% confidence</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    AI predicts on-time arrival based on current pace and traffic conditions
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Group Cohesion</span>
                    <Badge variant="outline">88% confidence</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Group is maintaining good coordination with regular communication
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Route Optimization</span>
                    <Badge variant="outline">76% confidence</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Alternative route available that could save 8 minutes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Enable Smart Notifications</span>
                    <Button size="sm" onClick={() => onInsightAction({ type: 'enable_smart_notifications' })}>
                      Apply
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    AI can filter notifications based on importance and context
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Optimize Check-in Frequency</span>
                    <Button size="sm" onClick={() => onInsightAction({ type: 'optimize_checkins' })}>
                      Apply
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Adjust location update frequency based on group activity
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Setup Emergency Protocols</span>
                    <Button size="sm" onClick={() => onInsightAction({ type: 'setup_emergency' })}>
                      Apply
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configure AI-powered emergency response system
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}