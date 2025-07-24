"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Send, 
  Brain, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageProcessor } from '@/lib/ai-services';
import { useOnboarding } from '@/hooks/useOnboarding';

interface IntelligentChatProps {
  groupId: string;
  members: any[];
  onSendMessage: (message: string) => void;
  messages: any[];
}

interface SmartSuggestion {
  id: string;
  text: string;
  type: 'quick_reply' | 'location' | 'eta' | 'emergency';
  icon: React.ReactNode;
}

export default function IntelligentChat({ 
  groupId, 
  members, 
  onSendMessage, 
  messages 
}: IntelligentChatProps) {
  const { markMilestone } = useOnboarding();
  const [message, setMessage] = useState('');
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [messageAnalysis, setMessageAnalysis] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate smart suggestions
  useEffect(() => {
    const suggestions: SmartSuggestion[] = [
      {
        id: 'location',
        text: '📍 Share my location',
        type: 'location',
        icon: <MapPin className="h-4 w-4" />,
      },
      {
        id: 'eta',
        text: '🕐 Share my ETA',
        type: 'eta',
        icon: <Clock className="h-4 w-4" />,
      },
      {
        id: 'arrived',
        text: '✅ I have arrived',
        type: 'quick_reply',
        icon: <MessageSquare className="h-4 w-4" />,
      },
      {
        id: 'delayed',
        text: '⏰ Running late',
        type: 'quick_reply',
        icon: <Clock className="h-4 w-4" />,
      },
    ];

    setSmartSuggestions(suggestions);
  }, []);

  // Analyze message as user types
  useEffect(() => {
    if (message.length > 3) {
      analyzeMessage(message);
    } else {
      setMessageAnalysis(null);
    }
  }, [message]);

  const analyzeMessage = async (text: string) => {
    try {
      const analysis = await MessageProcessor.analyzeMessage(text, {
        groupId,
        members,
      });
      
      setMessageAnalysis(analysis);
    } catch (error) {
      console.error('Message analysis failed:', error);
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      markMilestone('hasUsedChat');
      onSendMessage(message);
      setMessage('');
      setMessageAnalysis(null);
    }
  };

  const applySuggestion = (suggestion: SmartSuggestion) => {
    if (suggestion.type === 'location') {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationMessage = `📍 My location: https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`;
          onSendMessage(locationMessage);
        },
        () => {
          onSendMessage('📍 Sharing my location...');
        }
      );
    } else if (suggestion.type === 'eta') {
      const eta = new Date(Date.now() + Math.random() * 3600000);
      const etaMessage = `🕐 My ETA: ${eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      onSendMessage(etaMessage);
    } else {
      onSendMessage(suggestion.text);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'urgent': return 'text-orange-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Smart Suggestions */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Quick Actions</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-xs"
            >
              {showSuggestions ? 'Hide' : 'Show'}
            </Button>
          </div>
          
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                {smartSuggestions.map((suggestion) => (
                  <motion.button
                    key={suggestion.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => applySuggestion(suggestion)}
                    className="flex items-center gap-2 p-2 text-left text-sm bg-background/50 hover:bg-background border rounded-lg transition-colors"
                  >
                    {suggestion.icon}
                    <span className="truncate">{suggestion.text}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Message Analysis */}
      <AnimatePresence>
        {messageAnalysis && message.length > 3 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-muted/50 rounded-lg p-3 border"
          >
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Message Analysis</span>
            </div>
            
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span>Sentiment:</span>
                <span className={getSentimentColor(messageAnalysis.sentiment.sentiment)}>
                  {messageAnalysis.sentiment.sentiment}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>Intent:</span>
                <Badge variant="outline" className="text-xs">
                  {messageAnalysis.intent.intent}
                </Badge>
              </div>
            </div>

            {messageAnalysis.autoResponses && messageAnalysis.autoResponses.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">Quick actions:</span>
                <div className="flex gap-1 mt-1">
                  {messageAnalysis.autoResponses.map((response: string, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setMessage(response)}
                      className="text-xs h-6"
                    >
                      {response}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <Button onClick={handleSendMessage} disabled={!message.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}