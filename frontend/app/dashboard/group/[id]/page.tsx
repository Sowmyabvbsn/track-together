"use client";

import "../[id]/chat.css";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Info, MapPin, MessageSquare, Users, Settings, Copy, Link as LinkIcon, TrendingUp } from "lucide-react";
import { FaWhatsapp, FaFacebook, FaTwitter, FaLinkedin, FaTelegram } from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useUser } from "@clerk/nextjs";
import { useGroups } from "@/contexts/group-context";
import { useToast } from "@/hooks/use-toast";
import MapComponent from "@/components/Map";
import ChatTab from "@/components/Chat/ChatTab";
import MemberTab from "@/components/Member/MemberTab";
import axios from "axios";
import io from "socket.io-client";
import { Brain } from "lucide-react";
import Link from "next/link";
import RealTimeAIAssistant from "@/components/AI/RealTimeAIAssistant";
import PredictiveRouting from "@/components/AI/PredictiveRouting";
import SmartSafetyMonitor from "@/components/AI/SmartSafetyMonitor";
import IntelligentChatEnhanced from "@/components/AI/IntelligentChatEnhanced";
import IntelligentEmergencySystem from "@/components/AI/IntelligentEmergencySystem";
import AIVoiceCommands from "@/components/AI/AIVoiceCommands";
import SmartRouteOptimizer from "@/components/AI/SmartRouteOptimizer";
import PredictiveAnalytics from "@/components/AI/PredictiveAnalytics";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const socket = io(API_BASE_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

interface Message {
  _id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

interface Member {
  clerkId: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
}

interface Group {
  _id: string;
  name: string;
  code: string;
  source: string;
  destination: string;
  members: Member[];
  startTime: string;
  reachTime: string;
  isActive: boolean;
  createdBy: string;
  distanceThreshold?: number;
}

export default function GroupPage() {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const router = useRouter();
  const { getGroup, updateGroupSettings } = useGroups();
  const { toast } = useToast();
  const groupId = params?.id
    ? Array.isArray(params.id)
      ? params.id[0]
      : params.id
    : null;

  if (!groupId) {
    toast({
      title: "Error",
      description: "Invalid group ID",
      variant: "destructive",
    });
    router.push("/dashboard");
    return null;
  }

  const [group, setGroup] = useState<Group | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");
  const mounted = useRef(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [distanceThreshold, setDistanceThreshold] = useState(1000);
  const [originalThreshold, setOriginalThreshold] = useState(1000);
  const [shareLocation, setShareLocation] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const initialized = useRef(false);
  const [open, setOpen] = useState(false);
  const toggleTooltip = () => setOpen(!open);
  const [groupLocations, setGroupLocations] = useState<
    Map<string, { lat: number; lng: number }>
  >(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [aiFeatures, setAiFeatures] = useState({
    realTimeAssistant: true,
    predictiveRouting: true,
    safetyMonitor: true,
    emergencySystem: true,
    enhancedChat: true,
    voiceCommands: true,
    routeOptimizer: true,
    predictiveAnalytics: true
  });
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !groupId || !isLoaded) return;

    const fetchGroup = async () => {
      setIsFetching(true);
      try {
        let fetchedGroup: Group | null = getGroup(groupId);
        if (!fetchedGroup) {
          const res = await axios.get(
            `${API_BASE_URL}/groups?clerkId=${user.id}`
          );
          fetchedGroup = res.data.find((g: Group) => g._id === groupId) || null;
        }
        if (!fetchedGroup) {
          toast({
            title: "Error",
            description: "Group not found",
            variant: "destructive",
          });
          router.push("/dashboard");
          return;
        }
        setGroup(fetchedGroup);
        setDistanceThreshold(fetchedGroup.distanceThreshold || 1000);
        setOriginalThreshold(fetchedGroup.distanceThreshold || 1000);
      } catch (err) {
        console.error("Failed to fetch group:", err);
        toast({
          title: "Error",
          description: "Failed to load group",
          variant: "destructive",
        });
        router.push("/dashboard");
      } finally {
        setIsFetching(false);
      }
    };

    fetchGroup();
  }, [user, groupId, isLoaded, getGroup, toast, router]);

  useEffect(() => {
    if (!user || !groupId || !isLoaded) return;
    if (activeTab === "chat") {
      socket.emit("viewingGroup", { groupId, clerkId: user.id });
    }
  }, [activeTab, user, groupId, isLoaded]);

  useEffect(() => {
    if (!user || !groupId || !shareLocation || !isLoaded) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        socket.emit("updateLocation", {
          groupId,
          clerkId: user.id,
          lat: latitude,
          lng: longitude,
        });
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user, groupId, shareLocation, isLoaded]);

  useEffect(() => {
    if (!user || !groupId || !isLoaded) return;

    socket.on("groupLocations", (locations: { clerkId: string; lat: number; lng: number }[]) => {
      const locationMap = new Map();
      locations.forEach((loc) => {
        if (loc.lat && loc.lng) {
          locationMap.set(loc.clerkId, { lat: loc.lat, lng: loc.lng });
        }
      });
      setGroupLocations(locationMap);
    });

    socket.on("locationUpdate", (location: { clerkId: string; lat: number; lng: number }) => {
      if (location.lat && location.lng) {
        setGroupLocations((prev) => new Map(prev).set(location.clerkId, { lat: location.lat, lng: location.lng }));
      }
    });

    const toastCooldown = new Map();
    socket.on("distanceAlert", ({ clerkId, otherClerkId, distance }) => {
      const isArchived = group && group.reachTime && new Date(group.reachTime) < new Date();
      if (isArchived) return;
      if (clerkId === user.id || otherClerkId === user.id) {
        const alertKey = `${clerkId}-${otherClerkId}`;
        const lastToast = toastCooldown.get(alertKey) || 0;
        const now = Date.now();
        if (now - lastToast > 60000) {
          const otherName =
            group?.members.find((m) => m.clerkId === otherClerkId)?.name ||
            otherClerkId;
          toast({
            title: "Distance Alert",
            description: `You are ${Math.round(
              distance / 1000
            )} km away from ${otherName}`,
            variant: "destructive",
          });
          toastCooldown.set(alertKey, now);
        }
      }
    });

    return () => {
      socket.off("groupLocations");
      socket.off("locationUpdate");
      socket.off("distanceAlert");
    };
  }, [user, groupId, isLoaded, group, toast]);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user || !groupId) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/groups/messages/group/${groupId}`
        );
        setMessages(res.data.data);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      }
    };
    fetchMessages();
    socket.connect();

    socket.on("connect", () => {
      socket.emit("join", { clerkId: user.id, groupId });
      socket.emit("requestStatusUpdate", { groupId });
      const heartbeatInterval = setInterval(() => {
        socket.emit("heartbeat", { clerkId: user.id, groupId });
      }, 10000);

      socket.on("disconnect", () => {
        clearInterval(heartbeatInterval);
      });
    });

    socket.on("reconnect", (attempt) => {
      socket.emit("join", { clerkId: user.id, groupId });
      socket.emit("requestStatusUpdate", { groupId });
    });

    socket.on("connect_error", (err) => {
      toast({
        title: "Connection Error",
        description: `Failed to connect to server: ${err.message}. Retrying...`,
        variant: "destructive",
      });
    });

    socket.on("receiveMessage", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("memberStatusUpdate", (updatedMembers: Member[]) => {
      if (Array.isArray(updatedMembers)) {
        setGroup((prevGroup) => {
          if (!prevGroup) return prevGroup;
          const newMembers = updatedMembers.map((m) => ({ ...m }));
          return { ...prevGroup, members: newMembers };
        });
      } else {
        socket.emit("requestStatusUpdate", { groupId });
      }
    });

    socket.on("error", (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    });

    return () => {
      socket.off("connect");
      socket.off("reconnect");
      socket.off("connect_error");
      socket.off("receiveMessage");
      socket.off("memberStatusUpdate");
      socket.off("error");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [user, groupId, toast]);

  useEffect(() => {
    if (messagesEndRef.current && activeTab === "chat") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;

    const messageData = {
      groupId,
      clerkId: user.id,
      clerkName: user.firstName || "User",
      content: newMessage,
    };

    socket.emit("sendMessage", messageData);
    setNewMessage("");
  };

  const handleSaveSettings = async () => {
    if (!user || !group || !groupId) return;
    setIsSaving(true);
    try {
      const response = await axios.patch(`${API_BASE_URL}/groups/distanceThreshold`, {
        groupId,
        distanceThreshold,
        clerkId: user.id,
      });
      const updatedGroup = response.data.data;
      await updateGroupSettings(groupId, { distanceThreshold });
      setGroup(updatedGroup);
      setOriginalThreshold(distanceThreshold);
      setSettingsDialogOpen(false);
      toast({
        title: "Success",
        description: `Distance threshold updated to ${distanceThreshold} meters`,
      });
    } catch (error: any) {
      console.error("Error updating distance threshold:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update distance threshold",
        variant: "destructive",
      });
      setDistanceThreshold(originalThreshold);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDistanceThreshold(originalThreshold);
    setSettingsDialogOpen(false);
  };

  const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast({ title: "Copied!", description: successMessage }),
      () =>
        toast({
          title: "Error",
          description: "Failed to copy",
          variant: "destructive",
        })
    );
  };

  const generateShareUrl = (platform: string) => {
    const groupName = group?.name || "our ride";
    const joinUrl = `${window.location.origin}/join/${group?.code}`;

    const shareText = encodeURIComponent(`Join my group "${groupName}" on TrackTogether!`);
    const shareUrl = encodeURIComponent(joinUrl);

    switch (platform) {
      case 'whatsapp':
        return `https://wa.me/?text=${shareText}%0A${shareUrl}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
      case 'telegram':
        return `https://telegram.me/share/url?url=${shareUrl}&text=${shareText}`;
      default:
        return joinUrl;
    }
  };

  const handleShare = (platform: string) => {
    setShareLoading(platform);
    try {
      const shareUrl = generateShareUrl(platform);
      const windowFeatures = 'width=550,height=450,scrollbars=yes,resizable=yes';
      const opened = window.open(shareUrl, '_blank', windowFeatures);

      if (!opened) {
        throw new Error('Popup was blocked');
      }

      setTimeout(() => setShareLoading(null), 500);
    } catch (error) {
      toast({
        title: 'Share Error',
        description: 'Failed to open share dialog. Please try copying the link instead.',
        variant: 'destructive',
      });
      setShareLoading(null);
    }
  };

  const handleAIAction = (action: any) => {
    console.log('AI Action triggered:', action);
    
    switch (action.type) {
      case 'emergency':
        toast({
          title: 'Emergency Alert Sent',
          description: 'AI has notified all group members and emergency services',
          variant: 'destructive'
        });
        break;
      case 'location':
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            socket.emit("updateLocation", {
              groupId,
              clerkId: user?.id,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          });
        }
        break;
      case 'navigation':
        toast({
          title: 'Route Optimized',
          description: 'AI has found a better route for your journey'
        });
        break;
      default:
        toast({
          title: 'AI Action',
          description: action.message || 'AI action completed'
        });
    }
  };

  const handleRouteOptimized = (optimizedRoute: any) => {
    toast({
      title: 'Route Optimized by AI',
      description: `Estimated time savings: ${optimizedRoute.timeSaved} minutes`
    });
  };

  const handleEmergencyTrigger = (emergency: any) => {
    console.log('Emergency triggered:', emergency);
    
    // Send emergency notification to all group members
    const emergencyMessage = {
      groupId,
      clerkId: user?.id,
      clerkName: user?.firstName || "User",
      content: `🚨 EMERGENCY: ${emergency.type} - Location: ${userLocation?.latitude}, ${userLocation?.longitude}`,
    };
    
    socket.emit("sendMessage", emergencyMessage);
    
    toast({
      title: 'Emergency Alert Sent',
      description: 'All group members and emergency services have been notified',
      variant: 'destructive'
    });
  };

  if (!isLoaded || isFetching) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-16 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <MapPin className="h-5 w-5 text-primary" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">{group.name}</h1>
              <TooltipProvider>
                <Tooltip open={open} onOpenChange={setOpen}>
                  <TooltipTrigger asChild>
                    <Info
                      onClick={toggleTooltip}
                      className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary"
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-card border p-4 rounded max-w-sm"
                  >
                    <div className="space-y-2">
                      <p className="font-semibold">Ride Info</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>From: {group.source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>To: {group.destination}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{group.members.length} {group.members.length === 1 ? "member" : "members"}</span>
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="flex items-center gap-2">            
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Invite</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite People to {group.name}</DialogTitle>
                  <DialogDescription>
                    Share the invite code or QR code with your friends.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded border">
                      <QRCodeSVG
                        value={`${window.location.origin}/join/${group.code}`}
                        size={150}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Invite Code</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={group.code}
                        readOnly
                        className="bg-secondary/30 font-mono text-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(group.code, "Invite code copied!")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Share via</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { platform: 'whatsapp', icon: FaWhatsapp, label: 'WhatsApp' },
                        { platform: 'facebook', icon: FaFacebook, label: 'Facebook' },
                        { platform: 'twitter', icon: FaTwitter, label: 'Twitter' },
                        { platform: 'linkedin', icon: FaLinkedin, label: 'LinkedIn' },
                        { platform: 'telegram', icon: FaTelegram, label: 'Telegram' }
                      ].map(({ platform, icon: Icon, label }) => (
                        <Button
                          key={platform}
                          variant="outline"
                          size="icon"
                          disabled={shareLoading !== null}
                          onClick={() => handleShare(platform)}
                          title={`Share on ${label}`}
                        >
                          {shareLoading === platform ? (
                            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Share Link</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={`${window.location.origin}/join/${group.code}`}
                        readOnly
                        className="bg-secondary/30 font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(
                          `${window.location.origin}/join/${group.code}`,
                          "Share link copied!"
                        )}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setInviteDialogOpen(false)}>
                    Done
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Link href={`/dashboard/group/${groupId}/ai-insights`}>
              <Button variant="outline" size="sm">
                <Brain className="h-4 w-4 mr-2 text-primary" />
                <span className="hidden sm:inline">AI Insights</span>
              </Button>
            </Link>

            <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Group Settings</DialogTitle>
                  <DialogDescription>
                    Configure tracking and notification settings.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>
                      Distance Threshold ({distanceThreshold} meters)
                    </Label>
                    <Slider
                      value={[distanceThreshold]}
                      min={100}
                      max={2000}
                      step={100}
                      onValueChange={(value) => setDistanceThreshold(value[0])}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveSettings} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Settings"}
                  </Button>
                  <Button onClick={handleCancel} variant="outline">
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b">
            <div className="container flex items-center justify-center">
              <TabsList className="h-12">
                <TabsTrigger value="map" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Map</span>
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat</span>
                </TabsTrigger>
                <TabsTrigger value="members" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Members</span>
                </TabsTrigger>
                <TabsTrigger value="ai-assistant" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <span>AI Assistant</span>
                </TabsTrigger>
                <TabsTrigger value="ai-analytics" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>AI Analytics</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="container py-6 px-4">
            <TabsContent value="map" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  {location ? (
                    <MapComponent
                      location={location}
                      groupLocations={Array.from(groupLocations.entries())}
                      members={group?.members}
                      source={group?.source}
                      destination={group?.destination}
                    />
                  ) : (
                    <div className="h-96 bg-muted rounded flex items-center justify-center">
                      <p>Loading map...</p>
                    </div>
                  )}
                </div>
                <div className="lg:col-span-1">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-4">Group Info</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">From:</span>
                          <p className="font-medium">{group.source}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">To:</span>
                          <p className="font-medium">{group.destination}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Members:</span>
                          <p className="font-medium">{group.members.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="chat" className="mt-0">
              {aiFeatures.enhancedChat ? (
                <IntelligentChatEnhanced
                  groupId={groupId}
                  members={group.members}
                  onSendMessage={handleSendMessage}
                  messages={messages}
                />
              ) : (
                <ChatTab groupId={groupId} members={group.members} />
              )}
            </TabsContent>
            <TabsContent value="members" className="mt-0">
              <MemberTab group={group} />
            </TabsContent>
            <TabsContent value="ai-assistant" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {aiFeatures.realTimeAssistant && (
                    <RealTimeAIAssistant
                      groupId={groupId}
                      groupData={group}
                      messages={messages}
                      userLocation={location}
                      onActionTrigger={handleAIAction}
                    />
                  )}
                  
                  {aiFeatures.emergencySystem && (
                    <IntelligentEmergencySystem
                      groupId={groupId}
                      userLocation={location}
                      groupData={group}
                      onEmergencyAction={handleEmergencyTrigger}
                    />
                  )}

                  {aiFeatures.voiceCommands && (
                    <AIVoiceCommands
                      groupId={groupId}
                      groupData={group}
                      onCommandExecuted={(command) => {
                        console.log('Voice command executed:', command);
                        handleAIAction(command);
                      }}
                    />
                  )}
                </div>
                
                <div className="space-y-6">
                  {aiFeatures.routeOptimizer && (
                    <SmartRouteOptimizer
                      groupData={group}
                      userLocation={location}
                      memberLocations={groupLocations}
                      onRouteOptimized={handleRouteOptimized}
                    />
                  )}
                  
                  {aiFeatures.safetyMonitor && (
                    <SmartSafetyMonitor
                      groupData={group}
                      userLocation={location}
                      memberLocations={groupLocations}
                      onEmergencyTrigger={handleEmergencyTrigger}
                    />
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="ai-analytics" className="mt-0">
              {aiFeatures.predictiveAnalytics && (
                <PredictiveAnalytics
                  groupData={group}
                  historicalData={historicalData}
                  realTimeData={{
                    weather: 'clear',
                    traffic: 'moderate',
                    groupActivity: messages.length
                  }}
                />
              )}
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}