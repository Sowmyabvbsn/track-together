"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Plus, 
  Users, 
  ArrowRight, 
  Trash2, 
  MapPin, 
  Calendar, 
  Clock,
  User
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useGroups } from "@/contexts/group-context";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistance, formatDuration } from "@/lib/utils";

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
  startTime: string;
  reachTime: string;
  members: Member[];
  createdBy: string;
  createdAt?: string;
}


const GroupsPage = () => {
  const { user, isLoaded } = useUser();
  const { activeGroups, archivedGroups, deleteGroup } = useGroups();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [groupMetrics, setGroupMetrics] = useState<Map<string, { distance: number; duration: { hours: number; minutes: number } }>>(new Map());

  useEffect(() => {
    const initializePage = async () => {
      try {
        if (!isLoaded) return;

        if (!user) {
          router.push("/sign-in");
          return;
        }

        if (activeGroups.length === 0 && archivedGroups.length === 0) {
          router.push("/dashboard");
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing groups page:", error);
        toast({
          title: "Error",
          description: "Failed to load groups data",
          variant: "destructive",
        });
      }
    };

    initializePage();
  }, [user, isLoaded, activeGroups, archivedGroups, router, toast]);

  const getGroupMetrics = async (source: string, destination: string) => {
    const key = `${source}-${destination}`;
    
    if (groupMetrics.has(key)) {
      return groupMetrics.get(key);
    }
    
    const hash = (source + destination).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const fallbackMetrics = {
      distance: Math.abs(100 + (hash % 400)),
      duration: {
        hours: Math.abs(1 + (hash % 9)),
        minutes: Math.abs(hash % 60)
      }
    };
    
    setGroupMetrics(prev => new Map(prev).set(key, fallbackMetrics));
    return fallbackMetrics;
  };

  useEffect(() => {
    const loadMetrics = async () => {
      const allGroups = [...activeGroups, ...archivedGroups];
      for (const group of allGroups) {
        await getGroupMetrics(group.source, group.destination);
      }
    };
    loadMetrics();
  }, [activeGroups, archivedGroups]);

  const getTotalMembers = () => {
    return [...activeGroups, ...archivedGroups].reduce((total: number, group: Group) => total + group.members.length, 0);
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    try {
      await deleteGroup(id);
      toast({ title: "Success", description: `Group "${name}" deleted!` });
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete group",
        variant: "destructive",
      });
    }
  };

  if (!isLoaded || isLoading) {
    return <GroupsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2" data-tour="groups-header">
            <h1 className="text-3xl font-bold">Your Groups</h1>
            <p className="text-muted-foreground">Manage your ride groups and see journey details</p>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="mr-4 bg-primary/10 p-2 rounded">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{activeGroups.length}</div>
                    <p className="text-xs text-muted-foreground">Ongoing rides</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Longest Journey</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="mr-4 bg-primary/10 p-2 rounded">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {activeGroups.length > 0 || archivedGroups.length > 0 ? 
                        formatDistance(Math.max(...[...activeGroups, ...archivedGroups].map((g: Group) => {
                          const key = `${g.source}-${g.destination}`;
                          return groupMetrics.get(key)?.distance || 0;
                        }))) : '0km'}
                    </div>
                    <p className="text-xs text-muted-foreground">Maximum distance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Fellow Riders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="mr-4 bg-primary/10 p-2 rounded">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{getTotalMembers()}</div>
                    <p className="text-xs text-muted-foreground">Total members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Groups List */}
          <div className="space-y-8">
            {/* Active Rides */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Active Rides</h3>
              {activeGroups.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-medium mb-2">No active rides</p>
                    <p className="text-sm text-muted-foreground">Create a new group or join one to start a ride</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeGroups.map((group: Group) => (
                    <Card key={group._id} className="hover:border-primary">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            <CardDescription>
                              {group.createdAt ? `Created ${new Date(group.createdAt).toLocaleDateString()} • ` : ''}{group.code}
                            </CardDescription>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Group</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure? This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteGroup(group._id, group.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{group.source}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span className="text-muted-foreground">{group.destination}</span>
                            </div>
                          </div>
                          {(() => {
                            const key = `${group.source}-${group.destination}`;
                            const metrics = groupMetrics.get(key) || {
                              distance: 0,
                              duration: { hours: 0, minutes: 0 }
                            };
                            return (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Estimated Distance</p>
                                  <p className="font-medium">{formatDistance(metrics.distance)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Est. Duration</p>
                                  <p className="font-medium">
                                    {formatDuration(metrics.duration.hours * 60 + metrics.duration.minutes)}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                          <div className="flex items-center justify-between">
                            <div className="flex -space-x-2">
                              {group.members.slice(0, 4).map((member: Member, i: number) => (
                                <TooltipProvider key={i}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="h-8 w-8 rounded-full bg-primary/15 border-2 border-background flex items-center justify-center text-xs font-medium">
                                        {member.name.charAt(0)}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{member.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                              {group.members.length > 4 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                                        +{group.members.length - 4}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{group.members.length - 4} more members</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <Button
                              onClick={() => router.push(`/dashboard/group/${group._id}`)}
                              size="sm"
                            >
                              View Group
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Past Rides */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Past Rides</h3>
              {archivedGroups.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-medium mb-2">No past rides</p>
                    <p className="text-sm text-muted-foreground">Completed rides will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {archivedGroups.map((group: Group) => (
                    <Card key={group._id} className="hover:border-primary opacity-75">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            <CardDescription>
                              {group.createdAt ? `Created ${new Date(group.createdAt).toLocaleDateString()} • ` : ''}{group.code}
                            </CardDescription>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Group</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure? This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteGroup(group._id, group.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{group.source}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span className="text-muted-foreground">{group.destination}</span>
                            </div>
                          </div>
                          {(() => {
                            const key = `${group.source}-${group.destination}`;
                            const metrics = groupMetrics.get(key) || {
                              distance: 0,
                              duration: { hours: 0, minutes: 0 }
                            };
                            return (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Estimated Distance</p>
                                  <p className="font-medium">{formatDistance(metrics.distance)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Est. Duration</p>
                                  <p className="font-medium">
                                    {formatDuration(metrics.duration.hours * 60 + metrics.duration.minutes)}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                          <div className="flex items-center justify-between">
                            <div className="flex -space-x-2">
                              {group.members.slice(0, 4).map((member: Member, i: number) => (
                                <TooltipProvider key={i}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="h-8 w-8 rounded-full bg-primary/15 border-2 border-background flex items-center justify-center text-xs font-medium">
                                        {member.name.charAt(0)}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{member.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                              {group.members.length > 4 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                                        +{group.members.length - 4}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{group.members.length - 4} more members</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <Button
                              onClick={() => router.push(`/dashboard/group/${group._id}`)}
                              size="sm"
                            >
                              View Group
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GroupsSkeleton = () => (
  <div className="container max-w-7xl mx-auto py-8 px-4 space-y-8">
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-64" />
      ))}
    </div>
  </div>
);

export default GroupsPage;