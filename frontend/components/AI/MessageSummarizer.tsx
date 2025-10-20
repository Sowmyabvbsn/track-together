'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, MapPin, Users, AlertCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { groqClient } from '@/lib/groq-client';
import type { Message } from '@/types/message';

interface MessageSummary {
  overall: string;
  keyPoints: string[];
  locationUpdates: string[];
  decisions: string[];
  questions: string[];
  missedSince: Date;
  messageCount: number;
}

interface MessageSummarizerProps {
  groupId: string;
  chatMessages: Message[];
  lastSeenTimestamp?: Date;
}

export function MessageSummarizer({
  groupId,
  chatMessages,
  lastSeenTimestamp
}: MessageSummarizerProps) {
  const [summary, setSummary] = useState<MessageSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [missedCount, setMissedCount] = useState(0);

  const calculateMissedMessages = () => {
    if (!lastSeenTimestamp) return chatMessages;

    return chatMessages.filter(
      msg => new Date(msg.timestamp) > lastSeenTimestamp
    );
  };

  const generateSummary = async () => {
    const missedMessages = calculateMissedMessages();

    if (missedMessages.length === 0) {
      setSummary(null);
      setMissedCount(0);
      return;
    }

    setMissedCount(missedMessages.length);

    if (missedMessages.length < 3) {
      return;
    }

    setLoading(true);
    try {
      const chatContext = missedMessages
        .map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.userName}: ${m.content}`)
        .join('\n');

      const prompt = `Summarize these missed group chat messages. Extract:
1. Overall summary (1-2 sentences)
2. Key points mentioned
3. Any location updates or movements
4. Decisions made by the group
5. Unanswered questions

Messages:
${chatContext}

Respond with JSON:
{
  "overall": "brief summary",
  "keyPoints": ["point1", "point2"],
  "locationUpdates": ["update1"],
  "decisions": ["decision1"],
  "questions": ["question1"]
}`;

      const result = await groqClient.generate(prompt);
      const response = result.response;

      try {
        const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanResponse);

        setSummary({
          overall: parsed.overall || 'No significant updates',
          keyPoints: parsed.keyPoints || [],
          locationUpdates: parsed.locationUpdates || [],
          decisions: parsed.decisions || [],
          questions: parsed.questions || [],
          missedSince: lastSeenTimestamp || new Date(),
          messageCount: missedMessages.length
        });
      } catch (parseError) {
        console.error('Failed to parse summary:', parseError);
        setSummary({
          overall: `${missedMessages.length} messages since you were away`,
          keyPoints: [],
          locationUpdates: [],
          decisions: [],
          questions: [],
          missedSince: lastSeenTimestamp || new Date(),
          messageCount: missedMessages.length
        });
      }
    } catch (error) {
      console.error('Summarization error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      generateSummary();
    }, 2000);

    return () => clearTimeout(debounceTimer);
  }, [chatMessages.length, lastSeenTimestamp]);

  if (!summary && missedCount === 0) {
    return null;
  }

  if (missedCount > 0 && missedCount < 3) {
    return (
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Badge variant="default">{missedCount} new</Badge>
            <span className="text-sm text-muted-foreground">
              {missedCount === 1 ? 'message' : 'messages'} since you were away
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">AI Summary</CardTitle>
            <Badge variant="default">{missedCount} new</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <CardDescription>
          Missed messages since{' '}
          {summary?.missedSince
            ? new Date(summary.missedSince).toLocaleTimeString()
            : 'you were away'}
        </CardDescription>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Summarizing messages...
            </div>
          ) : summary ? (
            <>
              <div className="bg-background p-3 rounded-lg">
                <p className="text-sm">{summary.overall}</p>
              </div>

              {summary.keyPoints.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Key Points
                  </h4>
                  <ul className="space-y-1">
                    {summary.keyPoints.map((point, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.locationUpdates.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location Updates
                  </h4>
                  <ul className="space-y-1">
                    {summary.locationUpdates.map((update, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{update}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.decisions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Decisions Made
                  </h4>
                  <ul className="space-y-1">
                    {summary.decisions.map((decision, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{decision}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.questions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    Unanswered Questions
                  </h4>
                  <ul className="space-y-1">
                    {summary.questions.map((question, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={generateSummary}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Regenerate Summary
              </Button>
            </>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
}
