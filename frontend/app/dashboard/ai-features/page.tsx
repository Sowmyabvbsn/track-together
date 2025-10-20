'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, MessageSquare, Calendar, Bell, Mic, Navigation, AlertCircle } from 'lucide-react';
import { SmartGroupCoordinator } from '@/components/AI/SmartGroupCoordinator';
import { ItineraryPlanner } from '@/components/AI/ItineraryPlanner';
import { ContextAwareChatAssistant } from '@/components/AI/ContextAwareChatAssistant';
import { MessageSummarizer } from '@/components/AI/MessageSummarizer';
import { PredictiveNotifications } from '@/components/AI/PredictiveNotifications';
import { VoiceActionCommands } from '@/components/AI/VoiceActionCommands';
import AIRouteOptimizer from '@/components/AI/AIRouteOptimizer';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

export default function AIFeaturesPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const urlGroupId = searchParams.get('groupId');
  const [groupId, setGroupId] = useState<string>(urlGroupId || 'demo-group');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!user || groupId === 'demo-group') {
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
          }
        ];

        const demoMembers = [
          {
            id: 'user1',
            name: 'Alice',
            location: { lat: 17.6868, lng: 83.2185 },
            lastUpdated: new Date()
          },
          {
            id: 'user2',
            name: 'Bob',
            location: { lat: 17.6869, lng: 83.2186 },
            lastUpdated: new Date()
          },
          {
            id: 'user3',
            name: 'Charlie',
            location: { lat: 17.6870, lng: 83.2187 },
            lastUpdated: new Date()
          }
        ];

        setChatMessages(demoMessages);
        setMembers(demoMembers);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

        const groupResponse = await axios.get(`${backendUrl}/api/groups/${groupId}`);
        const groupData = groupResponse.data;
        setGroup(groupData);

        try {
          const messagesResponse = await axios.get(`${backendUrl}/api/messages/${groupId}`);
          setChatMessages(messagesResponse.data || []);
        } catch (err) {
          console.log('No messages found, using empty array');
          setChatMessages([]);
        }

        const memberLocations = await Promise.all(
          groupData.members.map(async (member: any) => {
            try {
              const locationResponse = await axios.get(
                `${backendUrl}/api/locations/${member.clerkId}/latest`
              );
              return {
                id: member.clerkId,
                name: member.name,
                location: {
                  lat: locationResponse.data.latitude,
                  lng: locationResponse.data.longitude
                },
                lastUpdated: new Date(locationResponse.data.timestamp)
              };
            } catch (err) {
              return {
                id: member.clerkId,
                name: member.name,
                location: { lat: 17.6868, lng: 83.2185 },
                lastUpdated: new Date()
              };
            }
          })
        );

        setMembers(memberLocations);
      } catch (error) {
        console.error('Error fetching group data:', error);
        setMembers([
          {
            id: 'user1',
            name: 'Demo User',
            location: { lat: 17.6868, lng: 83.2185 },
            lastUpdated: new Date()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          setCurrentLocation({ lat: 17.6868, lng: 83.2185 });
        }
      );
    } else {
      setCurrentLocation({ lat: 17.6868, lng: 83.2185 });
    }
  }, [user, groupId]);

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

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading AI features...</p>
          </div>
        </div>
      </div>
    );
  }

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
          Powered by Groq AI
        </Badge>
      </div>

      {groupId === 'demo-group' && (
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Using Demo Data
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  You're viewing AI features with demo data. To use with real group data,
                  navigate to a group from your dashboard and access AI features from there.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              destination={{ lat: 17.6880, lng: 83.2195 }}
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
            destination={currentLocation || { lat: 17.6868, lng: 83.2185 }}
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
                AI suggests optimal meeting points based on everyone's actual location using LocationIQ API
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
              <li>Groq AI - Free cloud AI with ultra-fast responses</li>
              <li>LocationIQ - Free tier with 5,000 requests/day for location search</li>
              <li>Web Speech API - Built into modern browsers, completely free</li>
              <li>Speech Synthesis API - Browser-native text-to-speech</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
