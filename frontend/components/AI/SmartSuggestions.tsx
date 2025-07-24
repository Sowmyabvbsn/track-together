"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Clock, MapPin, MessageSquare, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GroupAnalytics, RouteOptimizer } from '@/lib/ai-services';

interface SmartSuggestionsProps {
  groupId: string;
  groupData: any;
  userLocation?: { lat: number; lng: number };
  onSuggestionApply: (suggestion: any) => void;
}

interface Suggestion {
  id: string;
  type: 'route' | 'timing' | 'communication';
  title: string;
  description: string;
  confidence: number;
  action: string;
  icon: React.ReactNode;
}

export default function SmartSuggestions({ 
  groupId, 
  groupData, 
  userLocation, 
  onSuggestionApply 
}: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    generateSuggestions();
  }, [groupId, groupData]);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const newSuggestions: Suggestion[] = [];

      // Group behavior analysis
      const behaviorAnalysis = GroupAnalytics.analyzeGroupBehavior(groupData);
      
      behaviorAnalysis.recommendations.forEach((rec: string, index: number) => {
        newSuggestions.push({
          id: `behavior-${index}`,
          type: 'communication',
          title: 'Group Coordination',
          description: rec,
          confidence: 0.85,
          action: 'apply_recommendation',
          icon: <MessageSquare className="h-4 w-4" />,
        });
      });

      // Route optimization suggestion
      if (groupData.source && groupData.destination) {
        newSuggestions.push({
          id: 'route-optimization',
          type: 'route',
          title: 'Route Optimization',
          description: 'Optimize your route for better travel time',
          confidence: 0.8,
          action: 'optimize_route',
          icon: <MapPin className="h-4 w-4" />,
        });
      }

      // Timing suggestions
      newSuggestions.push({
        id: 'timing-optimization',
        type: 'timing',
        title: 'Timing Suggestion',
        description: 'Consider leaving 15 minutes earlier to avoid traffic',
        confidence: 0.75,
        action: 'adjust_timing',
        icon: <Clock className="h-4 w-4" />,
      });

      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (suggestion: Suggestion) => {
    setAppliedSuggestions(prev => new Set(prev).add(suggestion.id));
    onSuggestionApply(suggestion);
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Smart Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Smart Suggestions
          <Badge variant="secondary" className="ml-auto">
            {suggestions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence>
          {suggestions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No suggestions available at the moment.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.1 }}
                  className="border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="bg-primary/10 p-2 rounded-full">
                        {suggestion.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{suggestion.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {suggestion.description}
                        </p>
                        <div className="flex gap-2">
                          {!appliedSuggestions.has(suggestion.id) ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => applySuggestion(suggestion)}
                                className="text-xs"
                              >
                                Apply
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => dismissSuggestion(suggestion.id)}
                                className="text-xs"
                              >
                                Dismiss
                              </Button>
                            </>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              ✓ Applied
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}