import { useEffect, useRef, useState } from "react";
import { ACCESS_TOKEN } from "../constants";
import { useWebSocketManager, CONNECTION_STATES, WebSocketMessage } from "./useWebSocketManager";
import { getWebSocketUrl } from "../utils/websocket";

// Cache of failed WebSocket routes to avoid repeated attempts
export const failedWebSocketRoutes = new Set<string>();

/**
 * Helper function to fetch data and update state
 */
export const fetchData = async <T>(
  setData: (data: T[]) => void, 
  fetchDataFunction: () => Promise<T[]>
): Promise<void> => {
  try {
    const data = await fetchDataFunction();
    setData(data);
    console.log("fetchData executed successfully, data updated.");
  } catch (error) {
    console.error("Error in fetchData:", error);
    // Return empty array if fetch fails
    setData([]);
  }
};

/**
 * Helper function to handle WebSocket messages
 */
export const handleMessage = async <T>(
  setData: (data: T[]) => void, 
  fetchDataFunction: () => Promise<T[]>
): Promise<void> => {
  try {
    await fetchData(setData, fetchDataFunction);
  } catch (error) {
    console.error("Error parsing WebSocket message:", error);
    console.error("Error parsing WebSocket message:", error); 
  }
};

/**
 * Helper function to handle WebSocket errors
 */
export const handleError = (event: Event) => {
  console.error("WebSocket Error:", event);
};

/**
 * Helper function to handle WebSocket connections
 */
export const handleClose = <T> (
  setData: (data: T[]) => void, 
  ws: React.MutableRefObject<WebSocket | null>, 
  fetchDataFunction: () => Promise<T[]>,
  sourceURL: string,
  timeoutRef: React.MutableRefObject<number | null>,
  maxAttempts: React.MutableRefObject<number>
): void => {
  // Clear any existing timeout
  if (timeoutRef.current !== null) {
    window.clearTimeout(timeoutRef.current);
  }
  
  // If connection closed with code 1006, this could indicate a missing route
  // 1006 is "Abnormal Closure" which happens with the "No route found" error
  if (ws.current && 'code' in ws.current && ws.current.code === 1006) {
    console.log(`WebSocket route ${sourceURL} appears to be missing on the server. Switching to polling.`);
    failedWebSocketRoutes.add(sourceURL);
    // Setup polling as fallback
    setupPolling(setData, fetchDataFunction);
    return;
  }
  
  // Limit reconnection attempts
  if (maxAttempts.current <= 0) {
    console.log(`Maximum reconnection attempts reached for ${sourceURL}. Stopping reconnection.`);
    
    // Add to failed routes to avoid future attempts
    failedWebSocketRoutes.add(sourceURL);
    
    // Setup polling as fallback
    setupPolling(setData, fetchDataFunction);
    return;
  }
  
  maxAttempts.current--;
  
  // Set a new timeout for reconnection
  timeoutRef.current = window.setTimeout(() => {
    connectWebSocket(setData, ws, fetchDataFunction, sourceURL, timeoutRef, maxAttempts);
  }, 5000);
};

/**
 * Helper function to setup polling as a fallback
 */
const setupPolling = <T>(
  setData: (data: T[]) => void,
  fetchDataFunction: () => Promise<T[]>
): number => {
  // Store in localStorage that we're using polling for this session
  localStorage.setItem('useWebSockets', 'false');
  
  // Immediately fetch data
  fetchData(setData, fetchDataFunction);
  
  // Return the interval ID so it can be cleared if needed
  return window.setInterval(() => {
    fetchData(setData, fetchDataFunction);
  }, 10000) as unknown as number; // Poll every 10 seconds
};

/**
 * Function to connect to WebSocket
 */
export const connectWebSocket = <T> (
  setData: (data: T[]) => void, 
  ws: React.MutableRefObject<WebSocket | null>, 
  fetchDataFunction: () => Promise<T[]>, 
  sourceURL: string,
  timeoutRef: React.MutableRefObject<number | null>,
  maxAttempts: React.MutableRefObject<number>
): (() => void) => {
  // Close existing connection if any
  if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
    try {
      ws.current.close();
    } catch (e) {
      console.error("Error closing existing WebSocket:", e);
    }
    ws.current = null;
  }
  
  // For dashboard page, support both authenticated and public mode
  // Check if we should use WebSockets at all
  if (localStorage.getItem('useWebSockets') === 'false') {
    console.log("WebSockets are disabled by user preference.");
    return () => {};
  }
  
  // Skip if this route has previously failed
  if (failedWebSocketRoutes.has(sourceURL)) {
    console.log(`Skipping WebSocket connection to ${sourceURL} (previously failed)`);
    return () => {};
  }
  
  try {
    // Get token from localStorage
    const token = localStorage.getItem(ACCESS_TOKEN);
    
    // Clean the source URL
    const cleanSourceURL = sourceURL?.replace(/^\/|\/$/g, '') || '';
    if (!cleanSourceURL) {
      console.warn("Empty sourceURL provided to WebSocket connection");
      return () => {};
    }
    
    // Construct WebSocket URL with proper path
    const socketUrl = getWebSocketUrl()
    
    console.log(`Connecting WebSocket to: ${socketUrl}`);
    
    // Create new WebSocket connection
    ws.current = new WebSocket(socketUrl);
    
    ws.current.onopen = (e) => {
      console.log(`WebSocket connected to ${socketUrl}`, e);
      
      // Reset max attempts on successful connection
      maxAttempts.current = 5;
      
      // Authenticate if token exists
      if (token && ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ 
          type: 'authenticate',
          token: token
        }));
      } else {
        console.log("No token available for WebSocket authentication. Connection will be unauthenticated.");
      }
    };
    
    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`WebSocket message received from ${socketUrl}:`, data);
        
        // Handle different types of messages
        if (data.type === 'error' && data.code === 401) {
          console.error("WebSocket authentication error:", data.message);
          // Don't try to reconnect for auth errors
          maxAttempts.current = 0;
          if (ws.current) {
            ws.current.close();
          }
          return;
        }
        
        // Trigger data refresh for other message types
        handleMessage(setData, fetchDataFunction);
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
        handleMessage(setData, fetchDataFunction);
      }
    };
    
    ws.current.onerror = (error) => {
      handleError(error);
      
      // Mark this route as failed after an error to avoid further attempts
      if (maxAttempts.current <= 1) {
        failedWebSocketRoutes.add(sourceURL);
      }
    };
    
    ws.current.onclose = (event) => {
      console.log(`WebSocket closed: ${socketUrl}, code: ${event.code}, reason: ${event.reason}`);
      
      // Don't try to reconnect on normal closure or if dashboard is public
      if (event.code === 1000) {
        console.log("WebSocket closed normally, not reconnecting.");
        return;
      }
      
      // If we get code 1006 (abnormal closure), this might be a missing route
      if (event.code === 1006) {
        console.log(`WebSocket route ${sourceURL} appears to be missing (code 1006). Switching to polling.`);
        failedWebSocketRoutes.add(sourceURL);
        
        // Setup polling immediately
        setupPolling(setData, fetchDataFunction);
        return;
      }
      
      handleClose(setData, ws, fetchDataFunction, sourceURL, timeoutRef, maxAttempts);
    };
    
    const currentWs = ws.current;
    
    return () => {
      // Clear any reconnection timeout
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Close the WebSocket connection
      if (currentWs) {
        try {
          currentWs.close();
        } catch (e) {
          console.error("Error closing WebSocket in cleanup:", e);
        }
      }
      ws.current = null;
    };
  } catch (error) {
    console.error("Failed to create WebSocket connection:", error);
    
    // Only attempt to reconnect if we haven't exceeded our max attempts
    if (maxAttempts.current <= 0) {
      console.log(`Maximum reconnection attempts reached for ${sourceURL}. Stopping reconnection.`);
      
      // Add to failed routes to avoid future attempts
      failedWebSocketRoutes.add(sourceURL);
      
      // Setup polling as fallback
      setupPolling(setData, fetchDataFunction);
      
      return () => {};
    }
    
    maxAttempts.current--;
    
    // Attempt to reconnect after delay
    timeoutRef.current = window.setTimeout(() => {
      connectWebSocket(setData, ws, fetchDataFunction, sourceURL, timeoutRef, maxAttempts);
    }, 5000);
    
    // Return a cleanup function
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }
};

/**
 * Legacy hook to fetch data via WebSocket
 * @deprecated Use useWebSocketChannel instead for better connection management
 */
export const useFetchWebSocket = <T> (
  fetchDataFunction: () => Promise<T[]>, 
  sourceURL: string
): T[] => {
  const [data, setData] = useState<T[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const maxAttemptsRef = useRef<number>(3); // Reduced from 5 to 3 to fail faster
  const pollIntervalRef = useRef<number | null>(null);
  
  // Try to use the new WebSocket manager if available
  let webSocketManager;
  try {
    webSocketManager = useWebSocketManager();
  } catch (e) {
    // WebSocketManager not available, will fall back to legacy method
    webSocketManager = null;
  }
  
  useEffect(() => {
    console.log(`Setting up WebSocket hook for ${sourceURL}`);
    
    // Initial data fetch - always do this regardless of WebSocket status
    fetchData(setData, fetchDataFunction);
    
    // If the new WebSocket manager is available, use it instead
    if (webSocketManager) {
      console.log(`Using new WebSocket manager for ${sourceURL}`);
      
      // Only subscribe if the connection is authenticated
      if (webSocketManager.status === CONNECTION_STATES.AUTHENTICATED) {
        const unsubscribe = webSocketManager.subscribe(sourceURL, (wsData: WebSocketMessage) => {
          // Process received data - trigger refetch
          handleMessage(setData, fetchDataFunction);
        });
        
        return unsubscribe;
      }
      
      // If not authenticated, check again when status changes
      const checkInterval = setInterval(() => {
        if (webSocketManager && webSocketManager.status === CONNECTION_STATES.AUTHENTICATED) {
          clearInterval(checkInterval);
          
          const unsubscribe = webSocketManager.subscribe(sourceURL, (wsData: WebSocketMessage) => {
            handleMessage(setData, fetchDataFunction);
          });
          
          // This won't actually get called, but we set it up for correctness
          return unsubscribe;
        }
      }, 1000);
      
      return () => {
        clearInterval(checkInterval);
      };
    }
    
    // Legacy code - only execute if the WebSocketManager isn't available
    
    // For the dashboard page, check if we're on the public route
    const isPublicDashboard = window.location.pathname === '/' && !localStorage.getItem(ACCESS_TOKEN);
    
    // Check if WebSockets should be disabled based on environment
    const isLocalDevelopment = 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1';
    
    const shouldUseWebSockets = 
      // Don't use WebSockets for unauthenticated public dashboard in development
      !(isPublicDashboard && isLocalDevelopment && localStorage.getItem('useWebSockets') !== 'true') &&
      // Skip if this route previously failed
      !failedWebSocketRoutes.has(sourceURL);
    
    // Only attempt WebSocket connection if sourceURL is provided and WebSockets should be used
    if (sourceURL && shouldUseWebSockets) {
      // Connect WebSocket
      const cleanup = connectWebSocket(
        setData, 
        ws, 
        fetchDataFunction, 
        sourceURL, 
        timeoutRef, 
        maxAttemptsRef
      );
      
      // Return cleanup function
      return typeof cleanup === 'function' ? cleanup : undefined;
    } else {
      // If WebSockets are disabled or route previously failed, use polling
      console.log(`Using polling for ${sourceURL} (WebSockets ${shouldUseWebSockets ? 'enabled' : 'disabled'})`);
      
      // Setup polling
      pollIntervalRef.current = window.setInterval(() => {
        fetchData(setData, fetchDataFunction);
      }, 10000) as unknown as number;
      
      // Return cleanup function
      return () => {
        if (pollIntervalRef.current !== null) {
          window.clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };
    }
  }, [fetchDataFunction, sourceURL, webSocketManager]);
  
  return data;
};