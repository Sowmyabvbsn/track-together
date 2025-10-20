'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Activity,
  MapPin,
  Clock,
  TrendingUp,
  Bell
} from 'lucide-react';
import axios from 'axios';
import { getSocket } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';

interface SafetyAlert {
  _id: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  aiAnalysis?: {
    confidence: number;
    reasoning: string;
    recommendations: string[];
  };
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  createdAt: string;
  metadata?: any;
}

interface RealTimeSafetyAIProps {
  groupId: string;
  userId: string;
  onAlertClick?: (alert: SafetyAlert) => void;
}

export default function RealTimeSafetyAI({ groupId, userId, onAlertClick }: RealTimeSafetyAIProps) {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (groupId) {
      loadAlerts();
      loadStats();
    }
  }, [groupId]);

  useEffect(() => {
    const socket = getSocket();

    socket.on('safety_alert', handleNewAlert);
    socket.on('alert_acknowledged', handleAlertAcknowledged);
    socket.on('alert_resolved', handleAlertResolved);
    socket.on('alert_dismissed', handleAlertDismissed);

    return () => {
      socket.off('safety_alert', handleNewAlert);
      socket.off('alert_acknowledged', handleAlertAcknowledged);
      socket.off('alert_resolved', handleAlertResolved);
      socket.off('alert_dismissed', handleAlertDismissed);
    };
  }, []);

  const handleNewAlert = (data: { alert: SafetyAlert }) => {
    setAlerts(prev => [data.alert, ...prev]);

    playAlertSound(data.alert.severity);

    toast({
      title: data.alert.title,
      description: data.alert.description,
      variant: data.alert.severity === 'critical' || data.alert.severity === 'high'
        ? 'destructive'
        : 'default',
    });
  };

  const handleAlertAcknowledged = (data: { alertId: string }) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert._id === data.alertId
          ? { ...alert, status: 'acknowledged' }
          : alert
      )
    );
  };

  const handleAlertResolved = (data: { alertId: string }) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert._id === data.alertId
          ? { ...alert, status: 'resolved' }
          : alert
      )
    );
  };

  const handleAlertDismissed = (data: { alertId: string }) => {
    setAlerts(prev => prev.filter(alert => alert._id !== data.alertId));
  };

  const playAlertSound = (severity: string) => {
    if (severity === 'critical' || severity === 'high') {
      const audio = new Audio('/Discordnotification.mp3');
      audio.play().catch(e => console.error('Audio play failed:', e));
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/safety/alerts/${groupId}`,
        { params: { userId } }
      );
      setAlerts(response.data.alerts || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/safety/stats/${groupId}`
      );
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const toggleMonitoring = async () => {
    setLoading(true);
    try {
      const endpoint = isMonitoring ? '/safety/monitor/stop' : '/safety/monitor/start';
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`, {
        groupId,
        userId,
      });

      setIsMonitoring(!isMonitoring);
      toast({
        title: isMonitoring ? 'Monitoring Stopped' : 'Monitoring Started',
        description: isMonitoring
          ? 'Safety monitoring has been disabled'
          : 'AI is now monitoring your location for safety',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle monitoring',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/safety/alerts/${alertId}/acknowledge`,
        { userId }
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to acknowledge alert',
        variant: 'destructive',
      });
    }
  };

  const resolveAlert = async (alertId: string, resolution: string) => {
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/safety/alerts/${alertId}/resolve`,
        { userId, resolution }
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resolve alert',
        variant: 'destructive',
      });
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/safety/alerts/${alertId}`,
        { data: { userId } }
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to dismiss alert',
        variant: 'destructive',
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-5 w-5" />;
      case 'medium':
        return <Activity className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Real-Time Safety AI
              </CardTitle>
              <CardDescription>
                AI-powered safety monitoring and alerts
              </CardDescription>
            </div>
            <Button
              onClick={toggleMonitoring}
              disabled={loading}
              variant={isMonitoring ? 'destructive' : 'default'}
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-orange-500">{stats.activeCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-500">{stats.resolvedCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Monitoring</p>
                <p className="text-2xl font-bold">
                  {isMonitoring ? (
                    <span className="text-green-500">Active</span>
                  ) : (
                    <span className="text-gray-500">Off</span>
                  )}
                </p>
              </div>
            </div>
          )}

          <ScrollArea className="h-[500px] pr-4">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No safety alerts</p>
                <p className="text-sm text-muted-foreground">
                  {isMonitoring
                    ? 'AI is actively monitoring your safety'
                    : 'Start monitoring to enable AI safety features'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeAlerts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Active Alerts</h3>
                    {activeAlerts.map(alert => (
                      <AlertCard
                        key={alert._id}
                        alert={alert}
                        onAcknowledge={acknowledgeAlert}
                        onResolve={resolveAlert}
                        onDismiss={dismissAlert}
                        onClick={onAlertClick}
                        getSeverityColor={getSeverityColor}
                        getSeverityIcon={getSeverityIcon}
                        getAlertTypeLabel={getAlertTypeLabel}
                      />
                    ))}
                  </div>
                )}

                {acknowledgedAlerts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Acknowledged Alerts</h3>
                    {acknowledgedAlerts.map(alert => (
                      <AlertCard
                        key={alert._id}
                        alert={alert}
                        onAcknowledge={acknowledgeAlert}
                        onResolve={resolveAlert}
                        onDismiss={dismissAlert}
                        onClick={onAlertClick}
                        getSeverityColor={getSeverityColor}
                        getSeverityIcon={getSeverityIcon}
                        getAlertTypeLabel={getAlertTypeLabel}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function AlertCard({
  alert,
  onAcknowledge,
  onResolve,
  onDismiss,
  onClick,
  getSeverityColor,
  getSeverityIcon,
  getAlertTypeLabel,
}: {
  alert: SafetyAlert;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string, resolution: string) => void;
  onDismiss: (id: string) => void;
  onClick?: (alert: SafetyAlert) => void;
  getSeverityColor: (severity: string) => string;
  getSeverityIcon: (severity: string) => JSX.Element;
  getAlertTypeLabel: (type: string) => string;
}) {
  return (
    <Alert
      className="mb-3 cursor-pointer hover:bg-accent transition-colors"
      onClick={() => onClick?.(alert)}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <AlertTitle className="flex items-center gap-2">
                {alert.title}
                <Badge variant={getSeverityColor(alert.severity) as any}>
                  {alert.severity}
                </Badge>
                <Badge variant="outline">{getAlertTypeLabel(alert.alertType)}</Badge>
              </AlertTitle>
              <AlertDescription className="mt-1">
                {alert.description}
              </AlertDescription>
            </div>
          </div>

          {alert.aiAnalysis && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>
                  AI Confidence: {Math.round(alert.aiAnalysis.confidence * 100)}%
                </span>
              </div>
              {alert.aiAnalysis.reasoning && (
                <p className="text-muted-foreground italic">
                  {alert.aiAnalysis.reasoning}
                </p>
              )}
              {alert.aiAnalysis.recommendations && alert.aiAnalysis.recommendations.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium">Recommendations:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {alert.aiAnalysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-muted-foreground">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {alert.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>
                {alert.location.latitude.toFixed(6)}, {alert.location.longitude.toFixed(6)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{new Date(alert.createdAt).toLocaleString()}</span>
          </div>

          {alert.status === 'active' && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onAcknowledge(alert._id);
                }}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Acknowledge
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  onResolve(alert._id, 'Manually resolved by user');
                }}
              >
                Resolve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(alert._id);
                }}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Dismiss
              </Button>
            </div>
          )}

          {alert.status === 'acknowledged' && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  onResolve(alert._id, 'Manually resolved by user');
                }}
              >
                Resolve
              </Button>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}
