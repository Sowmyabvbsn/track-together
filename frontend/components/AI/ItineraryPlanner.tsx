'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Plus, Trash2, CheckCircle2, Navigation } from 'lucide-react';
import { groqClient } from '@/lib/groq-client';
import type { Message } from '@/types/message';

interface ItineraryItem {
  id: string;
  title: string;
  location?: string;
  time?: string;
  completed: boolean;
  suggestedBy: 'user' | 'ai';
}

interface ItineraryPlannerProps {
  groupId: string;
  chatMessages: Message[];
}

export function ItineraryPlanner({ groupId, chatMessages }: ItineraryPlannerProps) {
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastAnalyzedCount, setLastAnalyzedCount] = useState(0);

  const analyzeChatForItinerary = async () => {
    if (chatMessages.length === 0 || chatMessages.length === lastAnalyzedCount) return;

    setAnalyzing(true);
    try {
      const recentMessages = chatMessages.slice(-20);
      const chatContext = recentMessages
        .map(m => {
          const userLabel =
            (m as any).userName ||
            (m as any).user ||
            (m as any).author ||
            'User';
          const messageText =
            (m as any).content ??
            (m as any).text ??
            (m as any).message ??
            (m as any).body ??
            '';
          return `${userLabel}: ${messageText}`;
        })
        .join('\n');

      const prompt = `Analyze this group chat conversation and extract any plans, destinations, or activities mentioned. Format as a JSON array of items with structure: {"title": "activity", "location": "place if mentioned", "time": "time if mentioned"}

Chat conversation:
${chatContext}

Return ONLY a valid JSON array, no explanations. If no plans found, return empty array [].`;

      const result = await groqClient.generate(prompt);
      const response = result.response;

      try {
        const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const extractedItems = JSON.parse(cleanResponse);

        if (Array.isArray(extractedItems)) {
          const newItems: ItineraryItem[] = extractedItems.map((item: any, index: number) => ({
            id: `ai-${Date.now()}-${index}`,
            title: item.title || 'Untitled activity',
            location: item.location,
            time: item.time,
            completed: false,
            suggestedBy: 'ai' as const
          }));

          const existingTitles = new Set(itinerary.map(i => i.title.toLowerCase()));
          const uniqueNewItems = newItems.filter(
            item => !existingTitles.has(item.title.toLowerCase())
          );

          if (uniqueNewItems.length > 0) {
            setItinerary(prev => [...prev, ...uniqueNewItems]);
          }
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
      }

      setLastAnalyzedCount(chatMessages.length);
    } catch (error) {
      console.error('Error analyzing chat:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleItemComplete = (id: string) => {
    setItinerary(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setItinerary(prev => prev.filter(item => item.id !== id));
  };

  const addCustomItem = () => {
    const newItem: ItineraryItem = {
      id: `user-${Date.now()}`,
      title: 'New activity',
      completed: false,
      suggestedBy: 'user'
    };
    setItinerary(prev => [...prev, newItem]);
  };

  useEffect(() => {
    if (chatMessages.length > lastAnalyzedCount) {
      const debounceTimer = setTimeout(() => {
        analyzeChatForItinerary();
      }, 2000);

      return () => clearTimeout(debounceTimer);
    }
  }, [chatMessages.length]);

  const completedCount = itinerary.filter(i => i.completed).length;
  const totalCount = itinerary.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Smart Itinerary
        </CardTitle>
        <CardDescription>
          AI automatically extracts plans from your group chat
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {analyzing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Analyzing chat for activities...
          </div>
        )}

        {totalCount > 0 && (
          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {completedCount} of {totalCount} completed
              </span>
            </div>
            <div className="h-2 w-32 bg-secondary-foreground/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          {itinerary.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No activities planned yet</p>
              <p className="text-xs mt-1">
                Chat about plans and AI will extract them automatically
              </p>
            </div>
          ) : (
            itinerary.map((item) => (
              <Card
                key={item.id}
                className={`transition-all ${
                  item.completed ? 'opacity-60 bg-secondary/50' : 'hover:shadow-md'
                }`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleItemComplete(item.id)}
                      className="mt-1"
                    >
                      <div
                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          item.completed
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground hover:border-primary'
                        }`}
                      >
                        {item.completed && (
                          <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className={`font-medium ${
                            item.completed ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {item.title}
                        </h4>
                        {item.suggestedBy === 'ai' && (
                          <Badge variant="secondary" className="text-xs">
                            AI Suggested
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1">
                        {item.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{item.location}</span>
                          </div>
                        )}
                        {item.time && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{item.time}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1">
                      {item.location && (
                        <Button size="sm" variant="ghost">
                          <Navigation className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={addCustomItem}
            variant="outline"
            className="flex-1 gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Activity
          </Button>
          <Button
            onClick={analyzeChatForItinerary}
            variant="outline"
            disabled={analyzing}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Scan Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
