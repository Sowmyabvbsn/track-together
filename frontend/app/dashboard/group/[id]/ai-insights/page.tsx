"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useGroups } from '@/contexts/group-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain } from 'lucide-react';
import SmartSuggestions from '@/components/AI/SmartSuggestions';
import PredictiveInsights from '@/components/AI/PredictiveInsights';
import SmartNotifications from '@/components/AI/SmartNotifications';
import { motion } from 'framer-motion';

export default function AIInsightsPage() {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const router = useRouter();
  const { getGroup } = useGroups();
  
  const groupId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const [group, setGroup] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [memberLocations, setMemberLocations] = useState<Map<string, { lat: number; lng: number }>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !groupId || !isLoaded) return;

    const fetchGroup = async () => {
      try {
        const fetchedGroup = getGroup(groupId);
        if (!fetchedGroup) {
          router.push('/dashboard');
          return;
        }
        setGroup(fetchedGroup);
      } catch (error) {
        console.error('Failed to fetch group:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [user, groupId, isLoaded, getGroup, router]);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error('Geolocation error:', error)
      );
    }
  }, []);

  const handleSuggestionApply = (suggestion: any) => {
    console.log('Applying suggestion:', suggestion);
    // Implement suggestion application logic here
  };

  const handleNotificationSettingsChange = (settings: any) => {
    console.log('Notification settings changed:', settings);
    // Implement settings persistence logic here
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading AI insights...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="hover:scale-105 transition-transform"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Insights</h1>
              <p className="text-muted-foreground">
                Intelligent analysis for {group.name}
              </p>
            </div>
          </div>
          <div className="ml-auto">
            <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-purple/10 px-4 py-2 rounded-full">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Powered</span>
            </div>
          </div>
        </motion.div>

        {/* AI Insights Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="suggestions" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="suggestions" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Smart Suggestions
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Predictive Insights
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Smart Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="suggestions" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SmartSuggestions
                  groupId={groupId}
                  groupData={group}
                  userLocation={userLocation}
                  onSuggestionApply={handleSuggestionApply}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <PredictiveInsights
                  groupData={group}
                  userLocation={userLocation}
                  memberLocations={memberLocations}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SmartNotifications
                  groupId={groupId}
                  userId={user?.id || ''}
                  onSettingsChange={handleNotificationSettingsChange}
                />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}