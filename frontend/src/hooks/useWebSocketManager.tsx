import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import socketManager, { CONNECTION_STATES } from './socketConnectionManager';
import type { ConnectionState, WebSocketMessage } from './socketConnectionManager';

// Re-export the types and constants so other files can still import from here
export { ConnectionState, WebSocketMessage, CONNECTION_STATES };

// Define context type
interface WebSocketContextType {
  status: ConnectionState;
  connect: () => void;
  disconnect: () => void;
  subscribe: (channel: string, callback: (data: WebSocketMessage) => void) => () => void;
  isChannelSupported: (channel: string) => boolean;
  supportedChannels: string[];
  debugInfo: () => any;
}

// Create a context for the WebSocket
const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages the WebSocket connection
 * This is now a lightweight wrapper around the socketManager singleton
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  // Track connection state locally for React
  const [status, setStatus] = useState<ConnectionState>(socketManager.getStatus());
  
  // Track available subscription channels locally for React
  const [supportedChannels, setSupportedChannels] = useState<string[]>(socketManager.getSupportedChannels());
  
  // Memoize the methods to prevent unnecessary re-renders
  const connect = useCallback(() => socketManager.connect(), []);
  const disconnect = useCallback(() => socketManager.disconnect(), []);
  const subscribe = useCallback(
    (channel: string, callback: (data: WebSocketMessage) => void) => 
      socketManager.subscribe(channel, callback),
    []
  );
  const isChannelSupported = useCallback(
    (channel: string) => socketManager.isChannelSupported(channel),
    []
  );
  const debugInfo = useCallback(() => socketManager.getDebugInfo(), []);
  
  // Subscribe to status changes
  useEffect(() => {
    // Subscribe to status changes from the singleton
    const unsubscribeStatus = socketManager.onStatusChange(newStatus => {
      setStatus(newStatus);
    });
    
    // Subscribe to channel list changes
    const unsubscribeChannels = socketManager.onChannelListChange(channels => {
      setSupportedChannels(channels);
    });
    
    // Return cleanup function
    return () => {
      unsubscribeStatus();
      unsubscribeChannels();
    };
  }, []);
  
  // Create the context value that wraps the singleton
  const contextValue: WebSocketContextType = useMemo(
    () => ({
      status,
      connect,
      disconnect,
      subscribe,
      isChannelSupported,
      supportedChannels,
      debugInfo
    }),
    [status, connect, disconnect, subscribe, isChannelSupported, supportedChannels, debugInfo]
  );
  
  // Provide the WebSocket context to children
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * Hook to use the WebSocket context
 * This remains the same so your existing code continues to work
 */
export const useWebSocketManager = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketManager must be used within a WebSocketProvider');
  }
  return context;
};