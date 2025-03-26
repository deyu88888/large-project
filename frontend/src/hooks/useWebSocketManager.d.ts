import { ReactNode } from 'react';
import { CONNECTION_STATES } from './socketConnectionManager';
import type { ConnectionState, WebSocketMessage } from './socketConnectionManager';
export { ConnectionState, WebSocketMessage, CONNECTION_STATES };
interface WebSocketContextType {
    status: ConnectionState;
    connect: () => void;
    disconnect: () => void;
    subscribe: (channel: string, callback: (data: WebSocketMessage) => void) => () => void;
    isChannelSupported: (channel: string) => boolean;
    supportedChannels: string[];
    debugInfo: () => any;
}
interface WebSocketProviderProps {
    children: ReactNode;
}
/**
 * Provider component that manages the WebSocket connection
 * This is now a lightweight wrapper around the socketManager singleton
 */
export declare const WebSocketProvider: React.FC<WebSocketProviderProps>;
/**
 * Hook to use the WebSocket context
 * This remains the same so your existing code continues to work
 */
export declare const useWebSocketManager: () => WebSocketContextType;
