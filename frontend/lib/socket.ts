import { io, Socket } from 'socket.io-client';

class SocketManager {
  private callbacks: Record<string, Function[]> = {}
  private socket: Socket | null = null
  private connected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 2000
  private reconnectTimer: NodeJS.Timeout | null = null

  constructor(private url: string) {
    this.initializeSocket()
  }

  private initializeSocket() {
    try {
      this.socket = io(this.url, {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval,
        timeout: 10000,
        transports: ['websocket', 'polling']
      });

      this.setupSocketListeners();
    } catch (error) {
      console.error('Socket initialization failed:', error);
      this.fallbackToMockMode();
    }
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emit('connect');
      console.log(`Connected to ${this.url}`);
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      this.emit('disconnect', reason);
      console.log('Disconnected from server:', reason);
      
      if (reason === 'io server disconnect') {
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnect();
    });

    // Forward all socket events to our callback system
    this.socket.onAny((eventName, ...args) => {
      this.emit(eventName, ...args);
    });
  }

  connect() {
    if (this.socket) {
      this.socket.connect();
    } else {
      this.fallbackToMockMode();
    }
  }

  private fallbackToMockMode() {
    console.warn('Falling back to mock socket mode');
    setTimeout(() => {
      this.connected = true;
      this.emit("connect");
      console.log(`Mock connected to ${this.url}`);
    }, 500);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    } else if (this.connected) {
      this.connected = false
      this.emit("disconnect")
      console.log("Disconnected from server")
    }
  }

  private reconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

      this.reconnectTimer = setTimeout(() => {
        this.connect()
      }, this.reconnectInterval)
    } else {
      console.log("Max reconnect attempts reached. Please try again later.")
      this.emit("reconnect_failed")
    }
  }

  on(event: string, callback: Function) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = []
    }
    this.callbacks[event].push(callback)
    
    // Also register with real socket if available
    if (this.socket && event !== 'connect' && event !== 'disconnect') {
      this.socket.on(event, callback as any);
    }
    
    return this
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      delete this.callbacks[event]
      if (this.socket) {
        this.socket.off(event);
      }
    } else if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter((cb) => cb !== callback)
      if (this.socket) {
        this.socket.off(event, callback as any);
      }
    }
    return this
  }

  emit(event: string, ...args: any[]) {
    // Emit to real socket first
    if (this.socket && this.connected) {
      this.socket.emit(event, ...args);
    }
    
    // Then emit to local callbacks
    if (this.callbacks[event]) {
      this.callbacks[event].forEach((callback) => {
        callback(...args)
      })
    }
    return this
  }

  sendLocation(location: { lat: number; lng: number }) {
    if (!this.connected) {
      console.warn("Cannot send location: not connected")
      return
    }
    
    this.emit("updateLocation", location);
  }

  sendMessage(message: { content: string; groupId: string }) {
    if (!this.connected) {
      console.warn("Cannot send message: not connected")
      return
    }
    
    this.emit("sendMessage", message);
  }

  // Simulate network issues
  simulateNetworkIssue() {
    this.disconnect()
  }
}

// Create a singleton instance
let socketInstance: SocketManager | null = null

export function getSocket(url?: string) {
  const socketUrl = url || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  
  if (!socketInstance) {
    socketInstance = new SocketManager(socketUrl)
  }
  return socketInstance
}

export function closeSocket() {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}

