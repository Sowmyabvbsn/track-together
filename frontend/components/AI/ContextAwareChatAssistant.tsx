'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Brain, MessageSquare, TrendingUp, AlertTriangle, MapPin, Send, Sparkles } from 'lucide-react';
import { ollamaClient } from '@/lib/ollama-client';
import type { Message } from '@/types/message';

interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative' | 'concerned';
  confidence: number;
  indicators: string[];
  suggestion?: string;
}

interface SuggestedReply {
  text: string;
  context: string;
}

interface ContextAwareChatAssistantProps {
  groupId: string;
  chatMessages: Message[];
  currentUserLocation?: { lat: number; lng: number };
  onSendMessage: (message: string) => void;
}

export function ContextAwareChatAssistant({
  groupId,
  chatMessages,
  currentUserLocation,
  onSendMessage
}: ContextAwareChatAssistantProps) {
  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null);
  const [suggestedReplies, setSuggestedReplies] = useState<SuggestedReply[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  const analyzeSentiment = async () => {
    if (chatMessages.length < 5) return;

    setAnalyzing(true);
    try {
      const recentMessages = chatMessages.slice(-10);
      const chatContext = recentMessages
        .map(m => `${m.userName}: ${m.content}`)
        .join('\n');

      const prompt = `Analyze the sentiment of this group chat. Identify if people are:
- Lost or confused
- Frustrated or concerned
- Having navigation issues
- Waiting or delayed
- Happy and on track

Chat:
${chatContext}

Respond with JSON: {"overall": "positive|neutral|negative|concerned", "confidence": 0-1, "indicators": ["reason1", "reason2"], "suggestion": "what the group might need"}`;

      const result = await ollamaClient.generate(prompt);
      const response = result.response;

      try {
        const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const analysis = JSON.parse(cleanResponse);
        setSentiment(analysis);
      } catch (parseError) {
        console.error('Failed to parse sentiment:', parseError);
      }
    } catch (error) {
      console.error('Sentiment analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const generateSuggestedReplies = async () => {
    if (chatMessages.length < 3) return;

    try {
      const recentMessages = chatMessages.slice(-8);
      const chatContext = recentMessages
        .map(m => `${m.userName}: ${m.content}`)
        .join('\n');

      const locationContext = currentUserLocation
        ? `Your current location: ${currentUserLocation.lat.toFixed(4)}, ${currentUserLocation.lng.toFixed(4)}`
        : 'Location not available';

      const prompt = `Based on this group chat conversation and location context, suggest 3 helpful, natural replies I could send.

Chat:
${chatContext}

${locationContext}

Format as JSON array: [{"text": "reply message", "context": "why this reply"}]
Keep replies casual, friendly, and contextual.`;

      const result = await ollamaClient.generate(prompt);
      const response = result.response;

      try {
        const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const replies = JSON.parse(cleanResponse);
        if (Array.isArray(replies)) {
          setSuggestedReplies(replies.slice(0, 3));
        }
      } catch (parseError) {
        console.error('Failed to parse replies:', parseError);
      }
    } catch (error) {
      console.error('Reply generation error:', error);
    }
  };

  const generateCustomReply = async () => {
    if (!customPrompt.trim()) return;

    try {
      const recentMessages = chatMessages.slice(-5);
      const chatContext = recentMessages
        .map(m => `${m.userName}: ${m.content}`)
        .join('\n');

      const prompt = `Recent chat context:
${chatContext}

User wants to: ${customPrompt}

Generate a natural, friendly message they can send to the group that accomplishes this.`;

      const result = await ollamaClient.generate(prompt);
      onSendMessage(result.response.trim());
      setCustomPrompt('');
    } catch (error) {
      console.error('Custom reply error:', error);
    }
  };

  useEffect(() => {
    if (chatMessages.length > 0) {
      const debounceTimer = setTimeout(() => {
        analyzeSentiment();
        generateSuggestedReplies();
      }, 3000);

      return () => clearTimeout(debounceTimer);
    }
  }, [chatMessages.length]);

  const getSentimentColor = (overall: string) => {
    switch (overall) {
      case 'positive': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'negative': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'concerned': return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      default: return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    }
  };

  const getSentimentIcon = (overall: string) => {
    switch (overall) {
      case 'positive': return TrendingUp;
      case 'negative':
      case 'concerned': return AlertTriangle;
      default: return Brain;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Context-Aware Assistant
          </CardTitle>
          <CardDescription>
            AI analyzes chat sentiment and suggests contextual replies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analyzing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Analyzing conversation...
            </div>
          )}

          {sentiment && (
            <Card className={`border ${getSentimentColor(sentiment.overall)}`}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  {React.createElement(getSentimentIcon(sentiment.overall), {
                    className: 'h-5 w-5 mt-0.5'
                  })}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium capitalize">{sentiment.overall} Mood</h4>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(sentiment.confidence * 100)}% confident
                      </Badge>
                    </div>

                    {sentiment.indicators.length > 0 && (
                      <div className="space-y-1 mb-3">
                        {sentiment.indicators.map((indicator, index) => (
                          <p key={index} className="text-sm flex items-center gap-1">
                            <span className="text-xs">•</span>
                            {indicator}
                          </p>
                        ))}
                      </div>
                    )}

                    {sentiment.suggestion && (
                      <div className="bg-background/50 p-2 rounded text-sm mt-2">
                        <strong>Suggestion:</strong> {sentiment.suggestion}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {suggestedReplies.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Suggested Replies
              </h4>
              <div className="space-y-2">
                {suggestedReplies.map((reply, index) => (
                  <Card
                    key={index}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onSendMessage(reply.text)}
                  >
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm mb-1">{reply.text}</p>
                          <p className="text-xs text-muted-foreground">
                            {reply.context}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-2">Custom AI Reply</h4>
            <div className="flex gap-2">
              <Textarea
                placeholder="Tell AI what you want to say... (e.g., 'Tell them I'm running 5 minutes late')"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="min-h-[60px]"
              />
              <Button
                onClick={generateCustomReply}
                disabled={!customPrompt.trim()}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {currentUserLocation && (
            <Card className="bg-secondary/30">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Using your location for contextual replies
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
