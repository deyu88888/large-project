import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import socketManager, { CONNECTION_STATES } from './socketConnectionManager';
// Re-export the types and constants so other files can still import from here
export { CONNECTION_STATES };
// Create a context for the WebSocket
const WebSocketContext = createContext(null);
/**
 * Provider component that manages the WebSocket connection
 * This is now a lightweight wrapper around the socketManager singleton
 */
export const WebSocketProvider = ({ children }) => {
    // Track connection state locally for React
    const [status, setStatus] = useState(socketManager.getStatus());
    // Track available subscription channels locally for React
    const [supportedChannels, setSupportedChannels] = useState(socketManager.getSupportedChannels());
    // Memoize the methods to prevent unnecessary re-renders
    const connect = useCallback(() => socketManager.connect(), []);
    const disconnect = useCallback(() => socketManager.disconnect(), []);
    const subscribe = useCallback((channel, callback) => socketManager.subscribe(channel, callback), []);
    const isChannelSupported = useCallback((channel) => socketManager.isChannelSupported(channel), []);
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
    const contextValue = useMemo(() => ({
        status,
        connect,
        disconnect,
        subscribe,
        isChannelSupported,
        supportedChannels,
        debugInfo
    }), [status, connect, disconnect, subscribe, isChannelSupported, supportedChannels, debugInfo]);
    // Provide the WebSocket context to children
    return (_jsx(WebSocketContext.Provider, { value: contextValue, children: children }));
};
/**
 * Hook to use the WebSocket context
 * This remains the same so your existing code continues to work
 */
export const useWebSocketManager = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocketManager must be used within a WebSocketProvider');
    }
    return context;
};
