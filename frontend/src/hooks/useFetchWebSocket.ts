import { useEffect, useRef, useState } from "react";

export const fetchData = async <T>(
  setData: (data: T[]) => void, 
  fetchDataFunction: () => Promise<T[]>
): Promise<void> => {
  const data = await fetchDataFunction();
  setData(data);
  console.log("fetchData executed successfully, data updated."); // TODO: remove all the console logs before deploying
};

export const handleMessage = async <T>(
  setData: (data: T[]) => void, 
  fetchDataFunction: () => Promise<T[]>
): Promise<void> => {
  try {
    await fetchData(setData, fetchDataFunction);
  } catch (error) {
    console.error("Error parsing WebSocket message:", error); // TODO: keep this, need to know the error
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
  timeoutRef: React.MutableRefObject<number | null>
): void => {
  // Clear any existing timeout
  if (timeoutRef.current !== null) {
    window.clearTimeout(timeoutRef.current);
  }
  
  // Set a new timeout for reconnection
  timeoutRef.current = window.setTimeout(() => {
    connectWebSocket(setData, ws, fetchDataFunction, sourceURL, timeoutRef);
  }, 5000);
};

export const connectWebSocket = <T> (
  setData: (data: T[]) => void, 
  ws: React.MutableRefObject<WebSocket | null>, 
  fetchDataFunction: () => Promise<T[]>, 
  sourceURL: string,
  timeoutRef: React.MutableRefObject<number | null>
) => {
  // Close existing connection if any
  if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
    ws.current.close();
  }
  
  const socketUrl = `${import.meta.env.VITE_WEBSOCKET_ADMIN_BASE_URL}/${sourceURL}/`;
  
  try {
    ws.current = new WebSocket(socketUrl);
    
    // ws.current.onopen = handleOpen;
    ws.current.onmessage = () => handleMessage(setData, fetchDataFunction);
    ws.current.onerror = handleError;
    ws.current.onclose = () => handleClose(setData, ws, fetchDataFunction, sourceURL, timeoutRef);
    
    const currentWs = ws.current;
    
    return () => {
      // Clear any reconnection timeout
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Close the WebSocket connection
      if (currentWs) {
        currentWs.close();
        ws.current = null;
      }
    };
  } catch (error) {
    console.error("Failed to create WebSocket connection:", error);
    // Attempt to reconnect after delay
    timeoutRef.current = window.setTimeout(() => {
      connectWebSocket(setData, ws, fetchDataFunction, sourceURL, timeoutRef);
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
  
  useEffect(() => {
    // Initial data fetch
    fetchData(setData, fetchDataFunction);
    
    // Connect WebSocket
    const cleanup = connectWebSocket(setData, ws, fetchDataFunction, sourceURL, timeoutRef);
    
    // Return cleanup function
    return () => {
      cleanup();
    };
  }, [fetchDataFunction, sourceURL]);
  
  return data;
};