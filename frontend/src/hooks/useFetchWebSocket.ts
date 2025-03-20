import { useEffect, useRef, useState } from "react";
import { ACCESS_TOKEN } from "../constants";

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

export const handleMessage = async <T>(
  setData: (data: T[]) => void, 
  fetchDataFunction: () => Promise<T[]>
): Promise<void> => {
  try {
    await fetchData(setData, fetchDataFunction);
  } catch (error) {
    console.error("Error parsing WebSocket message:", error);
  }
};

export const handleError = (event: Event) => {
  console.error("WebSocket Error:", event);
};

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
  
  // Limit reconnection attempts
  if (maxAttempts.current <= 0) {
    console.log(`Maximum reconnection attempts reached for ${sourceURL}. Stopping reconnection.`);
    return;
  }
  
  maxAttempts.current--;
  
  // Set a new timeout for reconnection
  timeoutRef.current = window.setTimeout(() => {
    connectWebSocket(setData, ws, fetchDataFunction, sourceURL, timeoutRef, maxAttempts);
  }, 5000);
};

export const connectWebSocket = <T> (
  setData: (data: T[]) => void, 
  ws: React.MutableRefObject<WebSocket | null>, 
  fetchDataFunction: () => Promise<T[]>, 
  sourceURL: string,
  timeoutRef: React.MutableRefObject<number | null>,
  maxAttempts: React.MutableRefObject<number>
) => {
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
    const socketUrl = import.meta.env.VITE_WEBSOCKET_ADMIN_BASE_URL 
      ? `${import.meta.env.VITE_WEBSOCKET_ADMIN_BASE_URL}/${cleanSourceURL}/`
      : `ws://127.0.0.1:8000/ws/${cleanSourceURL}/`;
    
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
    
    ws.current.onerror = handleError;
    
    ws.current.onclose = (event) => {
      console.log(`WebSocket closed: ${socketUrl}, code: ${event.code}, reason: ${event.reason}`);
      
      // Don't try to reconnect on normal closure or if dashboard is public
      if (event.code === 1000) {
        console.log("WebSocket closed normally, not reconnecting.");
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

export const useFetchWebSocket = <T> (
  fetchDataFunction: () => Promise<T[]>, 
  sourceURL: string
) => {
  const [data, setData] = useState<T[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const maxAttemptsRef = useRef<number>(5); // Limit reconnection attempts
  
  useEffect(() => {
    console.log(`Setting up WebSocket hook for ${sourceURL}`);
    
    // Initial data fetch - always do this regardless of WebSocket status
    fetchData(setData, fetchDataFunction);
    
    // For the dashboard page, check if we're on the public route
    const isPublicDashboard = window.location.pathname === '/' && !localStorage.getItem(ACCESS_TOKEN);
    
    // Check if WebSockets should be disabled based on environment
    const isLocalDevelopment = 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1';
    
    const shouldUseWebSockets = 
      // Don't use WebSockets for unauthenticated public dashboard in development
      !(isPublicDashboard && isLocalDevelopment && localStorage.getItem('useWebSockets') !== 'true');
    
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
    }
    
    return undefined;
  }, [fetchDataFunction, sourceURL]);
  
  // Poll for updates if WebSockets are disabled
  useEffect(() => {
    const isWebSocketsDisabled = localStorage.getItem('useWebSockets') === 'false';
    
    if (isWebSocketsDisabled) {
      console.log("WebSockets disabled - using polling fallback");
      const pollInterval = setInterval(() => {
        fetchData(setData, fetchDataFunction);
      }, 10000); // Poll every 10 seconds
      
      return () => clearInterval(pollInterval);
    }
  }, [fetchDataFunction]);
  
  return data;
};