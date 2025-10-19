'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, MessageSquare, Calendar, Bell, Mic, Navigation } from 'lucide-react';
import { SmartGroupCoordinator } from '@/components/AI/SmartGroupCoordinator';
import { ItineraryPlanner } from '@/components/AI/ItineraryPlanner';
import { ContextAwareChatAssistant } from '@/components/AI/ContextAwareChatAssistant';
import { MessageSummarizer } from '@/components/AI/MessageSummarizer';
import { PredictiveNotifications } from '@/components/AI/PredictiveNotifications';
import { VoiceActionCommands } from '@/components/AI/VoiceActionCommands';
import AIRouteOptimizer from '@/components/AI/AIRouteOptimizer';
import { useUser } from '@clerk/nextjs';

export default function AIFeaturesPage() {
  const { user } = useUser();
  const [groupId, setGroupId] = useState<string>('demo-group');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | undefined>();

  useEffect(() => {
    const demoMessages = [
      {
        id: '1',
        content: 'Hey everyone, heading to the mall now!',
        userName: 'Alice',
        userId: 'user1',
        timestamp: new Date(Date.now() - 30 * 60000),
        groupId
      },
      {
        id: '2',
        content: 'Cool, I\'m at the coffee shop. Should I wait?',
        userName: 'Bob',
        userId: 'user2',
        timestamp: new Date(Date.now() - 25 * 60000),
        groupId
      },
      {
        id: '3',
        content: 'Let\'s meet at the restaurant for lunch at 1pm',
        userName: 'Charlie',
        userId: 'user3',
        timestamp: new Date(Date.now() - 20 * 60000),
        groupId
      },
      {
        id: '4',
        content: 'Sounds good! Anyone know if they have outdoor seating?',
        userName: 'Alice',
        userId: 'user1',
        timestamp: new Date(Date.now() - 15 * 60000),
        groupId
      },
      {
        id: '5',
        content: 'After lunch, maybe we can check out that new store?',
        userName: 'Bob',
        userId: 'user2',
        timestamp: new Date(Date.now() - 10 * 60000),
        groupId
      }
    ];

    const demoMembers = [
      {
        id: 'user1',
        name: 'Alice',
        location: { lat: 40.7589, lng: -73.9851 },
        lastUpdated: new Date()
      },
      {
        id: 'user2',
        name: 'Bob',
        location: { lat: 40.7614, lng: -73.9776 },
        lastUpdated: new Date()
      },
      {
        id: 'user3',
        name: 'Charlie',
        location: { lat: 40.7580, lng: -73.9855 },
        lastUpdated: new Date()
      }
    ];

    setChatMessages(demoMessages);
    setMembers(demoMembers);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          setCurrentLocation({ lat: 40.7589, lng: -73.9851 });
        }
      );
    } else {
      setCurrentLocation({ lat: 40.7589, lng: -73.9851 });
    }
  }, []);

  const handleSendMessage = (message: string) => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      content: message,
      userName: user?.firstName || 'You',
      userId: user?.id || 'current-user',
      timestamp: new Date(),
      groupId
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI-Powered Features</h1>
            <p className="text-muted-foreground">
              Smart coordination and assistance for your group
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="mt-2">
          <Sparkles className="h-3 w-3 mr-1" />
          Powered by Ollama (Local AI)
        </Badge>
      </div>

      <Tabs defaultValue="coordinator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="coordinator" className="gap-2">
            <Navigation className="h-4 w-4" />
            <span className="hidden sm:inline">Coordinator</span>
          </TabsTrigger>
          <TabsTrigger value="route" className="gap-2">
            <Navigation className="h-4 w-4" />
            <span className="hidden sm:inline">Route AI</span>
          </TabsTrigger>
          <TabsTrigger value="itinerary" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Itinerary</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Chat AI</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Summary</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="gap-2">
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">Voice</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coordinator">
          <SmartGroupCoordinator groupId={groupId} members={members} />
        </TabsContent>

        <TabsContent value="route">
          {currentLocation ? (
            <AIRouteOptimizer
              origin={currentLocation}
              destination={{ lat: 40.7580, lng: -73.9855 }}
              waypoints={[]}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Getting your location...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="itinerary">
          <ItineraryPlanner groupId={groupId} chatMessages={chatMessages} />
        </TabsContent>

        <TabsContent value="chat">
          <ContextAwareChatAssistant
            groupId={groupId}
            chatMessages={chatMessages}
            currentUserLocation={currentLocation}
            onSendMessage={handleSendMessage}
          />
        </TabsContent>

        <TabsContent value="summary">
          <MessageSummarizer
            groupId={groupId}
            chatMessages={chatMessages}
            lastSeenTimestamp={new Date(Date.now() - 20 * 60000)}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <PredictiveNotifications
            groupId={groupId}
            members={members}
            currentUserId={user?.id || 'current-user'}
            destination={{ lat: 40.7589, lng: -73.9851 }}
          />
        </TabsContent>

        <TabsContent value="voice">
          <VoiceActionCommands
            groupId={groupId}
            onShowMap={() => alert('Opening map view...')}
            onSendMessage={handleSendMessage}
            onSearchPlaces={(query) => alert(`Searching for: ${query}`)}
            currentLocation={currentLocation}
          />
        </TabsContent>
      </Tabs>

      <Card className="mt-8 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            About These Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-sm">
              <strong className="block mb-1">Smart Coordinator</strong>
              <p className="text-muted-foreground text-xs">
                AI suggests optimal meeting points based on everyone's location using LocationIQ API
              </p>
            </div>
            <div className="text-sm">
              <strong className="block mb-1">Itinerary Planner</strong>
              <p className="text-muted-foreground text-xs">
                Automatically extracts plans and activities from group chat conversations
              </p>
            </div>
            <div className="text-sm">
              <strong className="block mb-1">Chat Assistant</strong>
              <p className="text-muted-foreground text-xs">
                Analyzes sentiment and suggests contextual replies based on location
              </p>
            </div>
            <div className="text-sm">
              <strong className="block mb-1">Message Summary</strong>
              <p className="text-muted-foreground text-xs">
                AI summarizes missed messages with key points and location updates
              </p>
            </div>
            <div className="text-sm">
              <strong className="block mb-1">Predictive Alerts</strong>
              <p className="text-muted-foreground text-xs">
                Smart notifications about arrivals, separations, and timing issues
              </p>
            </div>
            <div className="text-sm">
              <strong className="block mb-1">Voice Commands</strong>
              <p className="text-muted-foreground text-xs">
                Control the app with natural voice commands using Web Speech API
              </p>
            </div>
          </div>

          <div className="pt-3 border-t text-xs text-muted-foreground">
            <strong className="block mb-1">Free Third-Party Services Used:</strong>
            <ul className="list-disc list-inside space-y-1">
              <li>Ollama (Local AI) - Free, runs on your machine</li>
              <li>LocationIQ - Free tier with 5,000 requests/day</li>
              <li>Web Speech API - Built into modern browsers, completely free</li>
              <li>Speech Synthesis API - Browser-native text-to-speech</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
