"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  HelpCircle,
  MapPin,
  Users,
  Bell,
  Settings,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface OnboardingChatboxProps {
  className?: string;
}

const SAMPLE_QUESTIONS = [
  "How do I create a new group ride?",
  "How can I join an existing group?",
  "What is the distance threshold feature?",
  "How do I share my location with the group?",
  "How do notifications work?",
  "Can I invite friends to my group?",
  "How do I use the chat feature?",
  "What are AI insights?",
];

const KNOWLEDGE_BASE = {
  "create group": {
    answer: "To create a new group ride:\n\n1. Go to your Dashboard\n2. Click the 'Create New Group Ride' card\n3. Fill in:\n   - Group name (e.g., 'Road Trip 2025')\n   - Source location (starting point)\n   - Destination location\n   - Start date and time\n   - Expected arrival time\n4. Click 'Create Group'\n\nYou'll get a unique invite code to share with others!",
    suggestions: ["How do I invite friends?", "What is an invite code?", "How do I set the route?"]
  },
  "join group": {
    answer: "To join an existing group:\n\n1. Get the invite code from the group creator\n2. Go to Dashboard and click 'Join Existing Group'\n3. Enter the invite code (e.g., ABC123)\n4. Click 'Join Group'\n\nAlternatively, you can use a direct invite link that someone shares with you!",
    suggestions: ["Where do I find the invite code?", "Can I join multiple groups?", "What if the code doesn't work?"]
  },
  "distance threshold": {
    answer: "Distance threshold is a safety feature that alerts you when group members are too far apart:\n\n• Default: 1000 meters (1km)\n• Range: 100m to 2000m\n• Adjustable in group settings\n• Sends notifications when exceeded\n\nTo change it:\n1. Open your group\n2. Click 'Settings'\n3. Adjust the slider\n4. Save changes",
    suggestions: ["How do I change group settings?", "What happens when threshold is exceeded?", "Can I disable distance alerts?"]
  },
  "share location": {
    answer: "Location sharing happens automatically when you:\n\n1. Join a group\n2. Allow location permissions in your browser\n3. Your location updates in real-time on the group map\n\nYour location is only shared with group members and helps with:\n• Real-time tracking\n• Distance alerts\n• Route coordination\n• Safety monitoring",
    suggestions: ["Is my location data safe?", "Can I stop sharing location?", "How accurate is location tracking?"]
  },
  "notifications": {
    answer: "RiderConnect has several types of notifications:\n\n📱 **Message Notifications**: New chat messages\n👥 **Group Updates**: Member joins/leaves\n📍 **Distance Alerts**: When members are too far apart\n🔔 **Reminders**: Trip start times\n\nYou can:\n• View all notifications in the Notifications page\n• Mark as read individually or all at once\n• Get real-time alerts for urgent messages",
    suggestions: ["How do I manage notification settings?", "Can I turn off certain notifications?", "What are distance alerts?"]
  },
  "invite friends": {
    answer: "To invite friends to your group:\n\n1. Open your group page\n2. Click the 'Invite' button\n3. Choose from these options:\n   • Share the QR code\n   • Copy the invite code\n   • Share via social media (WhatsApp, Facebook, etc.)\n   • Copy the direct join link\n\nFriends can join by:\n• Scanning the QR code\n• Entering the invite code\n• Clicking the shared link",
    suggestions: ["How long do invite codes last?", "Can I limit group size?", "How do I remove someone from a group?"]
  },
  "chat feature": {
    answer: "The group chat helps you coordinate with your team:\n\n💬 **Real-time messaging**: Instant communication\n🏷️ **@mentions**: Tag specific members\n📍 **Quick actions**: Share location, ETA, arrival status\n🤖 **AI suggestions**: Smart reply suggestions\n\nFeatures:\n• Message history\n• Online/offline status\n• Typing indicators\n• Message timestamps",
    suggestions: ["How do I mention someone?", "Can I share my location in chat?", "What are AI suggestions?"]
  },
  "ai insights": {
    answer: "AI Insights provide intelligent analysis of your group:\n\n🧠 **Smart Suggestions**: Route optimization, timing recommendations\n📊 **Predictive Insights**: Group behavior patterns, coordination score\n🔔 **Smart Notifications**: Filtered alerts based on importance\n📈 **Analytics**: Group performance metrics\n\nAccess AI Insights:\n1. Open any group\n2. Click 'AI Insights' button\n3. Explore different tabs for various insights",
    suggestions: ["How accurate are AI predictions?", "Can I disable AI features?", "What data does AI use?"]
  },
  "safety features": {
    answer: "RiderConnect prioritizes your safety:\n\n🚨 **Distance Alerts**: Warns when members are too far apart\n📍 **Real-time Tracking**: Live location updates\n⚡ **Emergency Features**: Quick emergency notifications\n🔒 **Privacy Controls**: Location sharing only with group members\n\nSafety tips:\n• Keep your phone charged\n• Share your ETA regularly\n• Use emergency features if needed\n• Stay within the distance threshold",
    suggestions: ["How do I send an emergency alert?", "Can I see everyone's location?", "What if someone goes offline?"]
  }
  "map": {
    answer: "The interactive map shows real-time locations of all group members:\n\n🗺️ **Features**:\n• Real-time member locations\n• Route visualization from source to destination\n• Multiple map layers (Standard, Satellite, Terrain)\n• Zoom and pan controls\n• Member status indicators (online/offline)\n\n**Map Controls**:\n• Zoom: Use + and - buttons or scroll\n• Layers: Switch between map types\n• Markers: Click on member markers for details",
    suggestions: ["How do I change map layers?", "Why can't I see someone's location?", "How accurate is the location tracking?"]
  },
  "privacy": {
    answer: "Your privacy and data security are our top priorities:\n\n🔒 **Data Protection**:\n• Location data is only shared with group members\n• No data is stored permanently on external servers\n• You can stop sharing location anytime\n• All communications are encrypted\n\n**Privacy Controls**:\n• Leave groups to stop sharing with those members\n• Location sharing stops when you close the app\n• No tracking outside of active group sessions",
    suggestions: ["How do I stop sharing my location?", "Who can see my data?", "Is my chat history saved?"]
  },
  "troubleshooting": {
    answer: "Common issues and solutions:\n\n🔧 **Location Issues**:\n• Enable location permissions in browser\n• Refresh the page if location isn't updating\n• Check if GPS is enabled on your device\n\n🔧 **Connection Issues**:\n• Check your internet connection\n• Try refreshing the page\n• Clear browser cache if problems persist\n\n🔧 **Group Issues**:\n• Verify invite code is correct\n• Make sure you're signed in\n• Contact group creator if code doesn't work",
    suggestions: ["Location not working?", "Can't join a group?", "App running slowly?"]
  },
  "getting started": {
    answer: "Welcome to RiderConnect! Here's how to get started:\n\n🚀 **First Steps**:\n1. **Create your first group** or **join an existing one**\n2. **Allow location permissions** when prompted\n3. **Invite friends** using the invite code or QR code\n4. **Start chatting** and coordinating your ride\n\n**Quick Tips**:\n• Use the map to see everyone's location\n• Set up distance alerts for safety\n• Try the AI insights for smart suggestions",
    suggestions: ["How do I create a group?", "How do I invite friends?", "What are the main features?"]
  },
  "features": {
    answer: "RiderConnect offers powerful features for group coordination:\n\n🎯 **Core Features**:\n• **Real-time Location Tracking**: See where everyone is\n• **Group Chat**: Communicate with your team\n• **Distance Alerts**: Safety notifications\n• **Route Planning**: Visualize your journey\n• **AI Insights**: Smart suggestions and analytics\n\n🔧 **Advanced Features**:\n• Multiple map layers\n• QR code invites\n• Social media sharing\n• Smart notifications\n• Predictive analytics",
    suggestions: ["How do I use the map?", "What are AI insights?", "How do distance alerts work?"]
  }
};

export default function OnboardingChatbox({ className }: OnboardingChatboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSamples, setShowSamples] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      // Add welcome message when first opened
      if (messages.length === 0) {
        const welcomeMessage: Message = {
          id: '1',
          type: 'bot',
          content: "👋 Welcome to RiderConnect! I'm your onboarding assistant.\n\nI can help you understand how to use the app, create groups, invite friends, and much more!\n\nTry asking me a question or click on one of the sample questions below.",
          timestamp: new Date(),
          suggestions: SAMPLE_QUESTIONS.slice(0, 4)
        };
        setMessages([welcomeMessage]);
      }
      
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const findBestMatch = (userInput: string): string | null => {
    const input = userInput.toLowerCase();
    
    // Direct keyword matching
    for (const [key, data] of Object.entries(KNOWLEDGE_BASE)) {
      if (input.includes(key) || key.split(' ').some(word => input.includes(word))) {
        return key;
      }
    }

    // Contextual matching
    if (input.includes('how') && (input.includes('create') || input.includes('make') || input.includes('new'))) {
      return 'create group';
    }
    if (input.includes('join') || input.includes('enter') || input.includes('code')) {
      return 'join group';
    }
    if (input.includes('distance') || input.includes('threshold') || input.includes('alert')) {
      return 'distance threshold';
    }
    if (input.includes('location') || input.includes('track') || input.includes('gps')) {
      return 'share location';
    }
    if (input.includes('notification') || input.includes('alert') || input.includes('bell')) {
      return 'notifications';
    }
    if (input.includes('invite') || input.includes('friend') || input.includes('share')) {
      return 'invite friends';
    }
    if (input.includes('chat') || input.includes('message') || input.includes('talk')) {
      return 'chat feature';
    }
    if (input.includes('ai') || input.includes('smart') || input.includes('insight')) {
      return 'ai insights';
    }
    if (input.includes('safety') || input.includes('emergency') || input.includes('secure')) {
      return 'safety features';
    }

    return null;
  };

  const generateBotResponse = (userInput: string): Message => {
    const matchedKey = findBestMatch(userInput);
    
    if (matchedKey && KNOWLEDGE_BASE[matchedKey as keyof typeof KNOWLEDGE_BASE]) {
      const knowledge = KNOWLEDGE_BASE[matchedKey as keyof typeof KNOWLEDGE_BASE];
      return {
        id: Date.now().toString(),
        type: 'bot',
        content: knowledge.answer,
        timestamp: new Date(),
        suggestions: knowledge.suggestions
      };
    }

    // Fallback responses for unmatched queries
    const fallbackResponses = [
      {
        content: "I'm not sure about that specific question, but I can help you with:\n\n• Creating and joining groups\n• Understanding app features\n• Safety and location settings\n• Chat and notifications\n• AI insights\n\nTry asking about any of these topics!",
        suggestions: ["How do I create a group?", "What are the main features?", "How do I invite friends?", "What are AI insights?"]
      },
      {
        content: "That's a great question! While I don't have a specific answer for that, here are some common topics I can help with:\n\n• Group management\n• Location sharing\n• Safety features\n• App navigation\n\nWhat would you like to know more about?",
        suggestions: ["How do groups work?", "Is my location data safe?", "How do I use the map?", "What are distance alerts?"]
      }
    ];

    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    return {
      id: Date.now().toString(),
      type: 'bot',
      content: randomResponse.content,
      timestamp: new Date(),
      suggestions: randomResponse.suggestions
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setShowSamples(false);
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse = generateBotResponse(inputMessage);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSampleQuestion = (question: string) => {
    setInputMessage(question);
    setShowSamples(false);
    setTimeout(() => handleSendMessage(), 100);
  };

  const resetChat = () => {
    setMessages([]);
    setShowSamples(true);
    setInputMessage('');
    // Re-add welcome message
    setTimeout(() => {
      const welcomeMessage: Message = {
        id: '1',
        type: 'bot',
        content: "👋 Welcome back! How can I help you with RiderConnect today?",
        timestamp: new Date(),
        suggestions: SAMPLE_QUESTIONS.slice(0, 4)
      };
      setMessages([welcomeMessage]);
    }, 100);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 hover:scale-110"
            >
              <MessageCircle className="h-6 w-6" />
              <span className="sr-only">Open onboarding assistant</span>
            </Button>
            
            {/* Pulsing indicator for new users */}
            <motion.div
              className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="sr-only">New messages</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className={cn(
              "fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]",
              className
            )}
          >
            <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur-sm">
              {/* Header */}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    Onboarding Assistant
                    <Badge variant="secondary" className="text-xs">
                      AI Powered
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="h-8 w-8"
                    >
                      {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent className="pt-0">
                      {/* Messages Area */}
                      <ScrollArea className="h-80 mb-4 pr-4">
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={cn(
                                "flex gap-3",
                                message.type === 'user' ? 'justify-end' : 'justify-start'
                              )}
                            >
                              {message.type === 'bot' && (
                                <div className="bg-primary/10 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                                  <Bot className="h-4 w-4 text-primary" />
                                </div>
                              )}
                              
                              <div className={cn(
                                "max-w-[80%] rounded-lg p-3 text-sm",
                                message.type === 'user' 
                                  ? 'bg-primary text-primary-foreground ml-auto' 
                                  : 'bg-muted'
                              )}>
                                <div className="whitespace-pre-wrap">{message.content}</div>
                                
                                {/* Suggestions */}
                                {message.suggestions && message.suggestions.length > 0 && (
                                  <div className="mt-3 space-y-1">
                                    <div className="text-xs text-muted-foreground mb-2">
                                      Related questions:
                                    </div>
                                    {message.suggestions.map((suggestion, index) => (
                                      <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSampleQuestion(suggestion)}
                                        className="text-xs h-7 mr-1 mb-1"
                                      >
                                        {suggestion}
                                      </Button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {message.type === 'user' && (
                                <div className="bg-primary/10 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                              )}
                            </motion.div>
                          ))}

                          {/* Typing Indicator */}
                          {isTyping && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex gap-3"
                            >
                              <div className="bg-primary/10 p-2 rounded-full h-8 w-8 flex items-center justify-center">
                                <Bot className="h-4 w-4 text-primary" />
                              </div>
                              <div className="bg-muted rounded-lg p-3">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>

                      {/* Sample Questions */}
                      {showSamples && messages.length <= 1 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-4"
                        >
                          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <HelpCircle className="h-3 w-3" />
                            Try these sample questions:
                          </div>
                          <div className="grid grid-cols-1 gap-1">
                            {SAMPLE_QUESTIONS.slice(0, 4).map((question, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleSampleQuestion(question)}
                                className="text-xs h-8 justify-start text-left"
                              >
                                <HelpCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                                <span className="truncate">{question}</span>
                              </Button>
                            ))}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSamples(false)}
                            className="w-full mt-2 text-xs"
                          >
                            Hide samples
                          </Button>
                        </motion.div>
                      )}

                      {/* Input Area */}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            ref={inputRef}
                            placeholder="Ask me anything about RiderConnect..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="flex-1"
                          />
                          <Button
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || isTyping}
                            size="icon"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="flex justify-between items-center">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowSamples(!showSamples)}
                              className="text-xs h-7"
                            >
                              <HelpCircle className="h-3 w-3 mr-1" />
                              Samples
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={resetChat}
                              className="text-xs h-7"
                            >
                              Reset
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {messages.length > 1 ? `${messages.length - 1} messages` : 'Start chatting'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default OnboardingChatbox