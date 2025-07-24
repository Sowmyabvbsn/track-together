"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Brain, 
  Settings,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface SmartNotificationsProps {
  groupId: string;
  userId: string;
  onSettingsChange: (settings: NotificationSettings) => void;
}

interface NotificationSettings {
  smartNotifications: boolean;
  urgentOnly: boolean;
  locationAlerts: boolean;
  messageAnalysis: boolean;
}

export default function SmartNotifications({ 
  groupId, 
  userId, 
  onSettingsChange 
}: SmartNotificationsProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({
    smartNotifications: true,
    urgentOnly: false,
    locationAlerts: true,
    messageAnalysis: true,
  });

  const [stats, setStats] = useState({
    totalNotifications: 42,
    smartFiltered: 8,
    timeSaved: 25,
  });

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
    
    toast({
      title: 'Settings Updated',
      description: `${key} has been ${value ? 'enabled' : 'disabled'}`,
    });
  };

  const testNotification = () => {
    toast({
      title: 'Test Notification',
      description: 'This is a test of the smart notification system',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Dashboard */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Smart Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalNotifications}</div>
              <div className="text-xs text-muted-foreground">Total Notifications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.smartFiltered}</div>
              <div className="text-xs text-muted-foreground">Smart Filtered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.timeSaved}m</div>
              <div className="text-xs text-muted-foreground">Time Saved</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Smart Notifications</label>
                <p className="text-xs text-muted-foreground">Enable AI-powered notification filtering</p>
              </div>
              <Switch
                checked={settings.smartNotifications}
                onCheckedChange={(checked) => updateSetting('smartNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Urgent Only Mode</label>
                <p className="text-xs text-muted-foreground">Only show high-priority notifications</p>
              </div>
              <Switch
                checked={settings.urgentOnly}
                onCheckedChange={(checked) => updateSetting('urgentOnly', checked)}
                disabled={!settings.smartNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Location Alerts</label>
                <p className="text-xs text-muted-foreground">Get notified about location changes</p>
              </div>
              <Switch
                checked={settings.locationAlerts}
                onCheckedChange={(checked) => updateSetting('locationAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Message Analysis</label>
                <p className="text-xs text-muted-foreground">Analyze message sentiment and intent</p>
              </div>
              <Switch
                checked={settings.messageAnalysis}
                onCheckedChange={(checked) => updateSetting('messageAnalysis', checked)}
                disabled={!settings.smartNotifications}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={testNotification}
              variant="outline"
              className="w-full"
              disabled={!settings.smartNotifications}
            >
              <Zap className="h-4 w-4 mr-2" />
              Test Notification System
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}