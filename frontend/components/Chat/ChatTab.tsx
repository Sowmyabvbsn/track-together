"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOnboarding } from "@/hooks/useOnboarding";
import { getSocket } from "@/lib/socket";

interface Message {
  _id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
}

interface ChatTabProps {
  groupId: string;
  members?: { clerkId: string; name: string; avatar?: string }[];
}

function ChatTab({ groupId, members }: ChatTabProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const { markMilestone } = useOnboarding();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<any>(null);
  const [tagging, setTagging] = useState(false);
  const [space, setSpace] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const fetchMessages = async (groupId: string): Promise<Message[]> => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/groups/messages/group/${groupId}`);
      const messageData = res.data.data || [];
      setMessages(messageData);
      return messageData;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat messages',
        variant: 'destructive'
      });
      return [];
    }
  };

  const { data: initialMessages, isLoading } = useQuery({
    queryKey: ["messages", groupId],
    queryFn: () => fetchMessages(groupId),
    enabled: !!groupId,
  });

  useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [initialMessages]);

  // Initialize socket connection
  useEffect(() => {
    if (!user || !groupId) return;

    const socketInstance = getSocket();
    setSocket(socketInstance);
    
    socketInstance.connect();
    
    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit("join", { clerkId: user.id, groupId });
    });
    
    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on("receiveMessage", (message: Message) => {
      setMessages((prev) => [...prev, message]);

      // Play notification sound
      setTimeout(() => {
        try {
          const audio = new Audio("/notification.mp3");
          audio.volume = 0.3;
          audio.play().catch((err) => console.log("Audio play error:", err));
        } catch (error) {
          console.log("Audio not available");
        }
      }, 300);
    });

    socketInstance.on("notification", (notification: { type: string; message: string; timestamp: string }) => {
      if (notification.type === "offline") {
        setMessages((prev) => [
          ...prev,
          {
            _id: `${Date.now()}`,
            groupId,
            senderId: "system",
            senderName: "System",
            content: notification.message,
            timestamp: new Date(notification.timestamp),
          },
        ]);
      }
    });

    return () => {
      socketInstance.off("receiveMessage");
      socketInstance.off("notification");
      socketInstance.off("connect");
      socketInstance.off("disconnect");
    };
  }, [user, groupId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    if (!isConnected) {
      toast({
        title: 'Connection Error',
        description: 'Not connected to chat server. Please try again.',
        variant: 'destructive'
      });
      return;
    }

    markMilestone('hasUsedChat');

    const message = {
      groupId,
      clerkId: user.id,
      clerkName: user.firstName || "User",
      content: newMessage,
    };

    socket?.emit("sendMessage", message);
    setNewMessage("");
    
    // Refresh messages after sending
    setTimeout(async () => {
      try {
        await fetchMessages(groupId);
      } catch (error) {
        console.error('Failed to refresh messages:', error);
      }
    }, 200);
  };

  const checkingMessage = (e: any) => {
    if (e.target.value === newMessage + "@") {
      setTagging(true);
      setNewMessage(e.target.value);
      setSpace(false);
    } else {
      setTagging(false);
      setNewMessage(e.target.value);
    }
  };

  const clickOnMentionName = (name: any) => {
    setNewMessage((prev) => prev + name + " ");
    setSpace(true);
  };

  return (
    <div className="flex flex-col h-[70vh]">
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg p-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            Reconnecting to chat server...
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading messages...</p>
          </div>
        )}
        
        {messages.map((message) => {
          const sender =
            message.senderId === "system"
              ? null
              : members?.find((m) => m.clerkId === message.senderId);
          const isYou = message.senderId === user?.id;

          return (
            <div
              key={message._id}
              className={`flex ${isYou ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex gap-2 max-w-[80%] ${isYou ? "flex-row-reverse" : "flex-row"}`}
              >
                {sender && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={sender.avatar} alt={sender.name} />
                    <AvatarFallback>{sender.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <div
                    className={`rounded p-3 ${
                      isYou
                        ? "bg-primary text-primary-foreground"
                        : message.senderId === "system"
                          ? "bg-muted text-center"
                          : "bg-muted"
                    }`}
                  >
                    <p>{message.content}</p>
                  </div>
                  <div
                    className={`flex gap-1 mt-1 text-xs text-muted-foreground ${
                      isYou ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span>{isYou ? "You" : message.senderName}</span>
                    <span>•</span>
                    <span>
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Member tagging dropdown */}
      <div className="relative">
        {tagging && !space ? (
          <div className="absolute bottom-full left-0 right-0 bg-background border rounded-lg shadow-lg mb-2 max-h-32 overflow-y-auto">
            {members?.map((member) => (
              <div
                className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0 flex items-center gap-2"
                onClick={() => clickOnMentionName(member.name)}
                key={member.clerkId}
              >
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs">
                  {member.name.charAt(0)}
                </div>
                {member.name}
              </div>
            ))}
          </div>
        ) : (
          null
        )}
      </div>

      <div className="border-t pt-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => checkingMessage(e)}
            disabled={!isConnected}
          />
          <Button type="submit" disabled={!isConnected || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();
export default function ChatTabWrapper(props: ChatTabProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatTab {...props} />
    </QueryClientProvider>
  );
}