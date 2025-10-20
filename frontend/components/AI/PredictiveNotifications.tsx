'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, Navigation, Users, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { locationIQClient } from '@/lib/locationiq-client';
import { groqClient } from '@/lib/groq-client';

interface Member {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  lastUpdated: Date;
}

interface PredictiveNotification {
  id: string;
  type: 'arrival' | 'traffic' | 'separation' | 'timing' | 'suggestion';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  dismissed: boolean;
  actionable: boolean;
  action?: string;
}

interface PredictiveNotificationsProps {
  groupId: string;
  members: Member[];
  currentUserId: string;
  destination?: { lat: number; lng: number };
}

export function PredictiveNotifications({
  groupId,
  members,
  currentUserId,
  destination
}: PredictiveNotificationsProps) {
  const [notifications, setNotifications] = useState<PredictiveNotification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const checkArrivalProximity = () => {
    if (!destination) return [];

    const newNotifications: PredictiveNotification[] = [];

    members.forEach(member => {
      if (member.id === currentUserId) return;

      const distance = locationIQClient.calculateDistance(
        member.location.lat,
        member.location.lng,
        destination.lat,
        destination.lng
      );

      if (distance < 0.5) {
        const eta = Math.ceil((distance / 60) * 60);
        newNotifications.push({
          id: `arrival-${member.id}-${Date.now()}`,
          type: 'arrival',
          title: `${member.name} is almost here!`,
          message: `${member.name} is ${distance.toFixed(1)}km away (arriving in ~${eta} min)`,
          priority: 'medium',
          timestamp: new Date(),
          dismissed: false,
          actionable: false
        });
      }
    });

    return newNotifications;
  };

  const checkGroupSeparation = () => {
    if (members.length < 2) return [];

    const newNotifications: PredictiveNotification[] = [];
    const maxDistance = Math.max(
      ...members.flatMap((m1, i) =>
        members.slice(i + 1).map(m2 =>
          locationIQClient.calculateDistance(
            m1.location.lat,
            m1.location.lng,
            m2.location.lat,
            m2.location.lng
          )
        )
      )
    );

    if (maxDistance > 5) {
      newNotifications.push({
        id: `separation-${Date.now()}`,
        type: 'separation',
        title: 'Group Widely Separated',
        message: `Group members are up to ${maxDistance.toFixed(1)}km apart. Consider regrouping?`,
        priority: 'high',
        timestamp: new Date(),
        dismissed: false,
        actionable: true,
        action: 'Find meeting point'
      });
    }

    return newNotifications;
  };

  const checkTimingIssues = () => {
    const newNotifications: PredictiveNotification[] = [];

    members.forEach(member => {
      const lastUpdateMinutes = (Date.now() - new Date(member.lastUpdated).getTime()) / 60000;

      if (lastUpdateMinutes > 10 && lastUpdateMinutes < 15) {
        newNotifications.push({
          id: `timing-${member.id}-${Date.now()}`,
          type: 'timing',
          title: `${member.name} hasn't updated location`,
          message: `Last seen ${Math.floor(lastUpdateMinutes)} minutes ago. Check if they're okay?`,
          priority: 'medium',
          timestamp: new Date(),
          dismissed: false,
          actionable: true,
          action: 'Send check-in message'
        });
      }
    });

    return newNotifications;
  };

  const generateAISuggestion = async () => {
    try {
      const prompt = `Analyze this group travel scenario and provide one helpful suggestion:

Group: ${members.length} members
Destination: ${destination ? 'Set' : 'Not set'}

Based on these factors, suggest one actionable improvement for coordination. Be brief (1 sentence).`;

      const result = await groqClient.generate(prompt);

      return {
        id: `suggestion-${Date.now()}`,
        type: 'suggestion' as const,
        title: 'AI Suggestion',
        message: result.response.trim(),
        priority: 'low' as const,
        timestamp: new Date(),
        dismissed: false,
        actionable: false
      };
    } catch (error) {
      console.error('AI suggestion error:', error);
      return null;
    }
  };

  const updateNotifications = async () => {
    const arrivalNotifs = checkArrivalProximity();
    const separationNotifs = checkGroupSeparation();
    const timingNotifs = checkTimingIssues();

    let allNotifications = [
      ...arrivalNotifs,
      ...separationNotifs,
      ...timingNotifs
    ];

    if (Math.random() < 0.3 && allNotifications.length < 3) {
      const suggestion = await generateAISuggestion();
      if (suggestion) {
        allNotifications.push(suggestion);
      }
    }

    const uniqueNotifications = allNotifications.filter(
      notif => !dismissed.has(notif.id)
    );

    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const newOnes = uniqueNotifications.filter(n => !existingIds.has(n.id));
      return [...prev.filter(n => !n.dismissed), ...newOnes]
        .sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        })
        .slice(0, 5);
    });
  };

  const dismissNotification = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, dismissed: true } : n))
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-500/10';
      case 'medium': return 'border-orange-500 bg-orange-500/10';
      default: return 'border-blue-500 bg-blue-500/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'arrival': return Clock;
      case 'traffic': return Navigation;
      case 'separation': return Users;
      case 'timing': return AlertTriangle;
      case 'suggestion': return CheckCircle2;
      default: return Bell;
    }
  };

  useEffect(() => {
    updateNotifications();

    const interval = setInterval(() => {
      updateNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [members, destination]);

  const activeNotifications = notifications.filter(n => !n.dismissed);

  if (activeNotifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Predictive Notifications
          </CardTitle>
          <CardDescription>
            AI monitors group activity and sends smart alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">All good! No alerts at the moment.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Smart Alerts
            </CardTitle>
            <CardDescription>
              {activeNotifications.length} active notification{activeNotifications.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Badge variant="default">{activeNotifications.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeNotifications.map(notification => {
          const Icon = getTypeIcon(notification.type);
          return (
            <Card
              key={notification.id}
              className={`border-2 ${getPriorityColor(notification.priority)}`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissNotification(notification.id)}
                        className="h-6 w-6 p-0 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </span>
                      {notification.actionable && notification.action && (
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          {notification.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
