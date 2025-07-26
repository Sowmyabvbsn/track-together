"use client";

import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCircle, Clock, Users, AlertTriangle, MessageSquare } from "lucide-react";
import { useTheme } from "next-themes";
import io from "socket.io-client";
import { useOnboarding } from "@/hooks/useOnboarding";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Notification {
  id: string;
  senderId?: string;
  groupId: string;
  senderName?: string;
  groupName: string;
  time: string;
  message: string;
  isRead: boolean;
  priority: "low" | "medium" | "high";
  type: "message" | "invitation" | "update" | "reminder" | "distance";
}

const NotificationSkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border rounded bg-card">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-muted"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-muted"></div>
              <div className="h-3 w-full rounded bg-muted"></div>
              <div className="h-3 w-3/4 rounded bg-muted"></div>
              <div className="h-8 w-28 rounded bg-muted"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const NotificationCard = ({ 
  notification, 
  markAsRead,
  isUnread
}: { 
  notification: Notification; 
  markAsRead: (id: string) => void; 
  isUnread: boolean;
}) => {
  const getRelativeTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return timeString;
    }
  };
  
  const getPriorityColor = () => {
    switch(notification.priority) {
      case "high": return "border-red-500 bg-red-50 dark:bg-red-950";
      case "medium": return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950";
      case "low": return "border-blue-500 bg-blue-50 dark:bg-blue-950";
      default: return "border-border bg-card";
    }
  };
  
  const getTypeIcon = () => {
    switch(notification.type) {
      case "message": return <MessageSquare className="w-4 h-4" />;
      case "invitation": return <Users className="w-4 h-4" />;
      case "reminder": return <Clock className="w-4 h-4" />;
      case "update": return <Bell className="w-4 h-4" />;
      case "distance": return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className={`p-4 rounded border ${isUnread ? `border-l-4 ${getPriorityColor()}` : 'border bg-card'}`}>
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 p-2 rounded">
          {getTypeIcon()}
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{notification.groupName}</h3>
              {isUnread && (
                <Badge variant={notification.priority === 'high' ? 'destructive' : 'secondary'}>
                  {notification.priority}
                </Badge>
              )}
            </div>
            <time className="text-xs text-muted-foreground">
              {getRelativeTime(notification.time)}
            </time>
          </div>
          
          <p className="text-sm text-foreground">{notification.message}</p>
          
          <div className="flex justify-between items-center">
            <Badge variant="outline" className="text-xs">
              {getTypeIcon()}
              <span className="ml-1">{notification.type}</span>
            </Badge>
            
            {isUnread && (
              <Button
                size="sm"
                onClick={() => markAsRead(notification.id)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Read
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Page = () => {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const { markMilestone } = useOnboarding();
  const [activeTab, setActiveTab] = useState<"unread" | "read">("unread");
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!user) return;

    markMilestone('hasViewedNotifications');

    const newSocket = io(API_BASE_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { clerkId: user.id },
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('notification', (notification: Notification) => {
      setNotifications((prev) => {
        if (!prev.some(n => n.id === notification.id)) {
          return [notification, ...prev];
        }
        return prev;
      });
      toast({
        title: `${notification.groupName} - ${notification.type}`,
        description: notification.message,
        variant: notification.priority === 'high' ? 'destructive' : 'default',
      });
    });

    newSocket.on('notificationRead', ({ notificationId, clerkId }) => {
      if (clerkId === user.id) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    });

    newSocket.on('error', ({ message }) => {
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    });

    newSocket.connect();

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications?clerkId=${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
        setNotifications(data);
        setLoading(false);
      } catch (err) {
        console.error('Fetch notifications error:', err);
        toast({
          title: 'Error',
          description: 'Failed to load notifications',
          variant: 'destructive',
        });
        setLoading(false);
      }
    };
    fetchNotifications();

    return () => {
      newSocket.disconnect();
    };
  }, [user, toast]);

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/mark-all`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user?.id }),
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast({ 
        title: "All notifications marked as read",
        description: "Your notification list has been updated",
      });
    } catch (err) {
      console.error('Mark all as read error:', err);
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        variant: 'destructive',
      });
    }
  };

  const markOneAsRead = (id: string) => {
    socket?.emit('markNotificationRead', { notificationId: id, clerkId: user?.id });
  };

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4 h-8 w-8 mx-auto border-t-2 border-b-2 rounded-full border-primary"></div>
          <p>Loading your notifications...</p>
        </div>
      </div>
    );
  }

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8" data-tour="notifications-header">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with your group activities</p>
          </div>
          <Button
            onClick={markAllAsRead}
            variant="outline"
            disabled={unread.length === 0}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "unread" | "read")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="unread" className="flex items-center gap-2">
              <span>Unread</span>
              <Badge variant="secondary">{unread.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="read" className="flex items-center gap-2">
              <span>Read</span>
              <Badge variant="secondary">{read.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unread">
            {loading ? (
              <NotificationSkeleton />
            ) : (
              <div>
                {unread.length === 0 ? (
                  <div className="p-8 text-center border rounded bg-card">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">All caught up! No unread notifications.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {unread.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        markAsRead={markOneAsRead}
                        isUnread={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="read">
            {loading ? (
              <NotificationSkeleton />
            ) : (
              <div>
                {read.length === 0 ? (
                  <div className="p-8 text-center border rounded bg-card">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No read notifications yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {read.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        markAsRead={markOneAsRead}
                        isUnread={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Page;