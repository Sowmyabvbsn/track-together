"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Wifi, WifiOff } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import io, { Socket } from "socket.io-client";

interface Member {
  clerkId: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
}

interface Group {
  _id: string;
  members: Member[];
}

interface MemberTabProps {
  group: Group;
}

import { getSocket } from "@/lib/socket";

export default function MemberTab({ group }: MemberTabProps) {
  const { user, isLoaded } = useUser();
  const [members, setMembers] = useState<Member[]>(group.members);
  const [statusReceived, setStatusReceived] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isLoaded || !group.members.length) return;

    setMembers(group.members);

    const checkMemberStatuses = async () => {
      try {
        const socketInstance = getSocket();
        setSocket(socketInstance);
        
        socketInstance.connect();
        
        socketInstance.on('connect', () => {
          setIsConnected(true);
          socketInstance.emit("join", { clerkId: user?.id, groupId: group._id });
          socketInstance.emit("requestStatusUpdate", { groupId: group._id });
        });
        
        socketInstance.on('disconnect', () => {
          setIsConnected(false);
        });
        
        const heartbeatInterval = setInterval(() => {
          if (user?.id && isConnected) {
            socketInstance.emit("heartbeat", { clerkId: user.id, groupId: group._id });
          }
        }, 10000);

        setStatusReceived(true);

        socketInstance.on("memberStatusUpdate", (updatedMembers: Member[]) => {
          if (Array.isArray(updatedMembers)) {
            setMembers(updatedMembers);
          }
        });

        return () => {
          clearInterval(heartbeatInterval);
          socketInstance.off("memberStatusUpdate");
          socketInstance.off("connect");
          socketInstance.off("disconnect");
        };
      } catch (error) {
        console.error("Error checking member statuses:", error);
        setStatusReceived(true);
      }
    };

    const cleanup = checkMemberStatuses();

    return () => {
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, [isLoaded, group.members, group._id, user?.id]);

  useEffect(() => {
    setMembers(group.members);
  }, [group.members]);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-200px)]">
      {/* Connection Status */}
      {!isConnected && statusReceived && (
        <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg p-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            Reconnecting to get live member status...
          </div>
        </div>
      )}
      
      <h2 className="text-xl font-bold mb-4 sticky top-0 bg-background py-2">
        Group Members ({members.length})
      </h2>
      
      {!statusReceived ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading member statuses...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {members.map((member: Member) => (
            <Card key={member.clerkId}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{member.name}</h3>
                      {member.clerkId === user?.id && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">(You)</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      {member.isOnline ? (
                        <>
                          <Wifi className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span className="text-green-600">Online</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-3 w-3 text-red-500 flex-shrink-0" />
                          <span className="text-red-600">Offline</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}