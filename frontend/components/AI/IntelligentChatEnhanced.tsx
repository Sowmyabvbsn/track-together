"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Send, 
  Brain, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  MessageSquare,
  Mic,
  MicOff,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageProcessor } from '@/lib/ai-services';
import { RealTimeAIService } from '@/lib/ai-real-time';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useUser } from '@clerk/nextjs';

interface IntelligentChatEnhancedProps {
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
  confidence: number;
}

interface MessageAnalysis {
  sentiment: { sentiment: string; confidence: number };
  intent: { intent: string; confidence: number };
  urgency: number;
  smartReplies: string[];
  suggestedActions: string[];
  autoResponses: string[];
}

export default function IntelligentChatEnhanced({ 
  groupId, 
  members, 
  onSendMessage, 
  messages 
}: IntelligentChatEnhancedProps) {
  const { user } = useUser();
  const { markMilestone } = useOnboarding();
  const [message, setMessage] = useState('');
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [messageAnalysis, setMessageAnalysis] = useState<MessageAnalysis | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate smart suggestions
  useEffect(() => {
    const suggestions: SmartSuggestion[] = [
      {
        id: 'location',
        text: '📍 Share my location',
        type: 'location',
        icon: <MapPin className="h-4 w-4" />,
        confidence: 0.9
      },
      {
        id: 'eta',
        text: '🕐 Share my ETA',
        type: 'eta',
        icon: <Clock className="h-4 w-4" />,
        confidence: 0.85
      },
      {
        id: 'arrived',
        text: '✅ I have arrived',
        type: 'quick_reply',
        icon: <MessageSquare className="h-4 w-4" />,
        confidence: 0.8
      },
      {
        id: 'delayed',
        text: '⏰ Running late',
        type: 'quick_reply',
        icon: <Clock className="h-4 w-4" />,
        confidence: 0.8
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
      setSmartReplies([]);
    }
  }, [message]);

  // Generate smart replies based on recent messages
  useEffect(() => {
    if (messages.length > 0) {
      generateSmartReplies();
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const analyzeMessage = async (text: string) => {
    try {
      const analysis = await MessageProcessor.analyzeMessage(text, {
        groupId,
        members,
      });

      // Map analysis result to MessageAnalysis interface
      setMessageAnalysis({
        sentiment: analysis.sentiment,
        intent: analysis.intent,
        urgency: analysis.urgencyScore,
        smartReplies: analysis.suggestions || [],
        suggestedActions: [], // or map from analysis if available
        autoResponses: analysis.autoResponses || [],
      });
    } catch (error) {
      console.error('Message analysis failed:', error);
    }
  };

  const generateSmartReplies = async () => {
    if (messages.length === 0) return;

    try {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderId === user?.id) return; // Don't generate replies for own messages

      const replies = await RealTimeAIService.generateSmartReplies(
        lastMessage.content,
        { groupName: 'Current Group', memberCount: members.length },
        messages.slice(-5)
      );

      setSmartReplies(replies.replies?.map((r: any) => r.text) || []);
    } catch (error) {
      console.error('Smart replies generation failed:', error);
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      markMilestone('hasUsedChat');
      onSendMessage(message);
      setMessage('');
      setMessageAnalysis(null);
      setSmartReplies([]);
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

  const useSmartReply = (reply: string) => {
    setMessage(reply);
    inputRef.current?.focus();
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
      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto space-y-4 p-4 border rounded-lg bg-muted/20">
        {messages.map((msg) => {
          const sender = members.find(m => m.clerkId === msg.senderId);
          const isYou = msg.senderId === user?.id;

          return (
            <div
              key={msg._id}
              className={`flex gap-3 ${isYou ? 'justify-end' : 'justify-start'}`}
            >
              {!isYou && sender && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={sender.avatar} alt={sender.name} />
                  <AvatarFallback>{sender.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              
              <div className={`max-w-[80%] ${isYou ? 'order-first' : ''}`}>
                <div
                  className={`rounded-lg p-3 ${
                    isYou
                      ? 'bg-primary text-primary-foreground'
                      : msg.senderId === 'system'
                        ? 'bg-muted text-center'
                        : 'bg-background border'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
                <div
                  className={`flex gap-1 mt-1 text-xs text-muted-foreground ${
                    isYou ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{isYou ? 'You' : msg.senderName}</span>
                  <span>•</span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {isYou && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={user?.imageUrl} alt="You" />
                  <AvatarFallback>{user?.firstName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Smart Replies */}
      <AnimatePresence>
        {smartReplies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <div className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              AI Smart Replies:
            </div>
            <div className="flex flex-wrap gap-2">
              {smartReplies.slice(0, 3).map((reply, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => useSmartReply(reply)}
                  className="text-xs h-7"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  {reply}
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Quick Actions</span>
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
                    <Badge variant="outline" className="ml-auto text-xs">
                      {Math.round(suggestion.confidence * 100)}%
                    </Badge>
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
              <span className="text-sm font-medium">AI Message Analysis</span>
            </div>
            
            <div className="flex items-center gap-4 text-xs mb-2">
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
              <div className="flex items-center gap-1">
                <span>Urgency:</span>
                <span className={messageAnalysis.urgency > 0.7 ? 'text-red-600' : 'text-green-600'}>
                  {Math.round(messageAnalysis.urgency * 100)}%
                </span>
              </div>
            </div>

            {messageAnalysis.autoResponses && messageAnalysis.autoResponses.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">AI suggestions:</span>
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
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Type a message... (AI will analyze as you type)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsVoiceMode(!isVoiceMode)}
            className={isVoiceMode ? 'bg-primary text-primary-foreground' : ''}
          >
            {isVoiceMode ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button onClick={handleSendMessage} disabled={!message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* AI Enhancement Notice */}
        <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Brain className="h-3 w-3" />
          Enhanced with AI analysis and smart suggestions
        </div>
      </div>
    </div>
  );
}