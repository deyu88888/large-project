import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { ACCESS_TOKEN } from '../constants';

// Define types for WebSocket message data
export interface WebSocketMessage {
  type: string;
  channel?: string;
  data?: any;
  status?: string;
  message?: string;
  available_channels?: string[];
  [key: string]: any;
}

// Define context type
interface WebSocketContextType {
  status: string;
  connect: () => void;
  disconnect: () => void;
  subscribe: (channel: string, callback: (data: WebSocketMessage) => void) => () => void;
  isChannelSupported: (channel: string) => boolean;
  supportedChannels: string[];
}

// Create a context for the WebSocket with null as default
const WebSocketContext = createContext<WebSocketContextType | null>(null);

/**
 * WebSocket connection states
 */
export const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  AUTHENTICATED: 'authenticated',
  AUTH_FAILED: 'auth-failed',
  ERROR: 'error'
} as const;

export type ConnectionState = typeof CONNECTION_STATES[keyof typeof CONNECTION_STATES];

interface WebSocketProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages the WebSocket connection
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  // Track connection state
  const [status, setStatus] = useState<ConnectionState>(CONNECTION_STATES.DISCONNECTED);
  // Track available subscription channels
  const [supportedChannels, setSupportedChannels] = useState<string[]>([]);
  // Reference to the WebSocket instance
  const wsRef = useRef<WebSocket | null>(null);
  // Track subscribers to various channels
  const channelSubscribers = useRef<Record<string, Array<(data: WebSocketMessage) => void>>>({});
  // Track connection attempts
  const connectionAttempt = useRef<number>(0);
  // Max connection attempts before giving up
  const MAX_CONNECTION_ATTEMPTS = 3;
  // Track if component is mounted
  const isMounted = useRef<boolean>(true);
  // Reference to reconnection timeout
  const reconnectTimeoutRef = useRef<number | null>(null);

  /**
   * Authenticate with the WebSocket server.
   * If no token is provided, send an authentication request indicating public mode.
   */
  const authenticate = useCallback((token: string | null = null) => {
    if (!token) {
      // Public access mode: send authentication request with "mode": "public"
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ 
          type: 'authenticate',
          mode: 'public'
        }));
        console.log('Public access authentication request sent');
      }
      return;
    }
    
    // Token-based authentication logic
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'authenticate',
        token
      }));
      console.log('Authentication request sent with token');
    }
  }, []);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    // Don't attempt to connect if we're already connected or connecting
    if (
      wsRef.current && 
      (wsRef.current.readyState === WebSocket.CONNECTING || 
       wsRef.current.readyState === WebSocket.OPEN)
    ) {
      return;
    }
    
    // Reset connection attempt if we're starting fresh
    if (status === CONNECTION_STATES.DISCONNECTED) {
      connectionAttempt.current = 0;
    }
    
    // Check if we've exceeded max attempts
    if (connectionAttempt.current >= MAX_CONNECTION_ATTEMPTS) {
      console.error(`Maximum connection attempts (${MAX_CONNECTION_ATTEMPTS}) reached. Giving up.`);
      setStatus(CONNECTION_STATES.ERROR);
      return;
    }
    
    connectionAttempt.current++;
    
    // Get authentication token
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      console.log('No authentication token available - using public access mode');
      // Do not set auth-failed status; continue with connection and let authenticate() handle public mode.
    }
    
    try {
      // Set state to connecting
      setStatus(CONNECTION_STATES.CONNECTING);
      
      // Determine WebSocket URL - use environment variable if available
      const baseUrl = import.meta.env.VITE_WEBSOCKET_ADMIN_BASE_URL || 'ws://127.0.0.1:8000/ws';
      const socketUrl = `${baseUrl}/main/`;
      
      console.log(`Connecting to WebSocket at ${socketUrl}`);
      
      // Create new WebSocket connection
      wsRef.current = new WebSocket(socketUrl);
      
      // Handle successful connection
      wsRef.current.onopen = () => {
        if (!isMounted.current) return;
        
        console.log('WebSocket connection established');
        setStatus(CONNECTION_STATES.CONNECTED);
        
        // Authenticate immediately after connection
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          if (!token) {
            console.log('No authentication token available - using public access mode');
            authenticate(null);
          } else {
            authenticate(token);
          }
        }
      };
      
      // Handle connection close
      wsRef.current.onclose = (event: CloseEvent) => {
        if (!isMounted.current) return;
        
        console.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
        setStatus(CONNECTION_STATES.DISCONNECTED);
        
        // If not a normal closure, attempt to reconnect after a delay
        if (event.code !== 1000 && isMounted.current) {
          const delay = Math.min(1000 * Math.pow(2, connectionAttempt.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${connectionAttempt.current})`);
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            if (isMounted.current) {
              connect();
            }
          }, delay);
        }
      };
      
      // Handle connection errors
      wsRef.current.onerror = (error: Event) => {
        if (!isMounted.current) return;
        console.error('WebSocket error:', error);
        setStatus(CONNECTION_STATES.ERROR);
      };
      
      // Handle incoming messages
      wsRef.current.onmessage = (event: MessageEvent) => {
        if (!isMounted.current) return;
        
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          // Handle authentication response
          if (data.type === 'auth_response') {
            if (data.status === 'success') {
              setStatus(CONNECTION_STATES.AUTHENTICATED);
              // Store supported channels if provided
              if (data.available_channels) {
                setSupportedChannels(data.available_channels);
              }
              
              // Re-subscribe to all active channels
              Object.keys(channelSubscribers.current).forEach(channel => {
                if (wsRef.current && channelSubscribers.current[channel].length > 0) {
                  wsRef.current.send(JSON.stringify({
                    type: 'subscribe',
                    channel
                  }));
                  console.log(`Re-subscribed to channel: ${channel}`);
                }
              });
            } else {
              console.error('Authentication failed:', data.message);
              setStatus(CONNECTION_STATES.AUTH_FAILED);
            }
            return;
          }
          
          // Handle channel data
          if (data.channel && channelSubscribers.current[data.channel]) {
            // Notify all subscribers to this channel
            channelSubscribers.current[data.channel].forEach(callback => {
              try {
                callback(data);
              } catch (callbackError) {
                console.error(`Error in channel ${data.channel} callback:`, callbackError);
              }
            });
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
    } catch (error) {
      if (!isMounted.current) return;
      console.error('Failed to create WebSocket connection:', error);
      setStatus(CONNECTION_STATES.ERROR);
    }
  }, [status, authenticate]);

  /**
   * Subscribe to a channel
   * @param {string} channel - Channel name to subscribe to
   * @param {function} callback - Callback function to execute on data
   * @returns {function} Unsubscribe function
   */
  const subscribe = useCallback((channel: string, callback: (data: WebSocketMessage) => void): (() => void) => {
    console.log(`Subscribing to channel: ${channel}`);
    
    // Initialize channel array if needed
    if (!channelSubscribers.current[channel]) {
      channelSubscribers.current[channel] = [];
      
      // Send subscription request if connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN &&
          status === CONNECTION_STATES.AUTHENTICATED) {
        wsRef.current.send(JSON.stringify({
          type: 'subscribe',
          channel
        }));
        console.log(`Sent subscription request for channel: ${channel}`);
      }
    }
    
    // Add callback to channel subscribers
    channelSubscribers.current[channel].push(callback);
    
    // Return unsubscribe function
    return () => {
      console.log(`Unsubscribing from channel: ${channel}`);
      
      if (channelSubscribers.current[channel]) {
        // Remove this callback
        channelSubscribers.current[channel] = channelSubscribers.current[channel].filter(
          cb => cb !== callback
        );
        
        // If no more subscribers, unsubscribe from server
        if (channelSubscribers.current[channel].length === 0) {
          delete channelSubscribers.current[channel];
          
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN &&
              status === CONNECTION_STATES.AUTHENTICATED) {
            wsRef.current.send(JSON.stringify({
              type: 'unsubscribe',
              channel
            }));
            console.log(`Sent unsubscribe request for channel: ${channel}`);
          }
        }
      }
    };
  }, [status]);

  /**
   * Manually disconnect from the server
   */
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User initiated disconnect');
      wsRef.current = null;
    }
    setStatus(CONNECTION_STATES.DISCONNECTED);
  }, []);

  /**
   * Check if a specific channel is supported
   * @param {string} channel - Channel to check
   * @returns {boolean} True if channel is supported
   */
  const isChannelSupported = useCallback((channel: string): boolean => {
    return supportedChannels.includes(channel);
  }, [supportedChannels]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    // Clean up on unmount
    return () => {
      isMounted.current = false;
      
      // Clear any pending reconnection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Close WebSocket connection
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
  }, [connect]);

  // Listen for token changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ACCESS_TOKEN) {
        // Token changed, reconnect with new token
        console.log('Authentication token changed, reconnecting...');
        
        if (wsRef.current) {
          wsRef.current.close(1000, 'Token changed');
          wsRef.current = null;
        }
        
        setStatus(CONNECTION_STATES.DISCONNECTED);
        connectionAttempt.current = 0;
        setTimeout(connect, 500); // Short delay before reconnect
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [connect]);

  // Create the context value
  const contextValue: WebSocketContextType = {
    status,
    connect,
    disconnect,
    subscribe,
    isChannelSupported,
    supportedChannels
  };

  // Provide the WebSocket context to children
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * Hook to use the WebSocket context
 * @returns {Object} WebSocket context
 */
export const useWebSocketManager = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  
  if (!context) {
    throw new Error('useWebSocketManager must be used within a WebSocketProvider');
  }
  
  return context;
};