import { useEffect, useState, useCallback, useRef } from 'react';
import { useWebSocketManager, CONNECTION_STATES, WebSocketMessage } from './useWebSocketManager';

interface WebSocketChannelOptions<T> {
  skipInitialFetch?: boolean;
  processData?: (data: WebSocketMessage) => T;
}

interface WebSocketChannelResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isConnected: boolean;
}

/**
 * Hook to subscribe to a WebSocket channel with initial data fetching
 * 
 * @param {string} channel - The WebSocket channel to subscribe to
 * @param {function} fetchFunction - Function to fetch initial data
 * @param {Object} options - Additional options
 * @param {boolean} options.skipInitialFetch - Skip the initial data fetch
 * @param {function} options.processData - Function to process incoming WebSocket data
 * @returns {Object} Channel data, loading state, and error state
 */
export function useWebSocketChannel<T>(
  channel: string, 
  fetchFunction: () => Promise<T | null>, 
  options: WebSocketChannelOptions<T> = {}
): WebSocketChannelResult<T> {
  // Default options
  const { 
    skipInitialFetch = false,
    processData = (data: WebSocketMessage) => (data.data || data) as T
  } = options;

  // State for data, loading status, and errors
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skipInitialFetch);
  const [error, setError] = useState<string | null>(null);
  
  // Get WebSocket manager context
  const { status, subscribe } = useWebSocketManager();
  
  // Track if initial fetch has been completed
  const initialFetchComplete = useRef(false);
  
  // Track component mount status
  const isMounted = useRef(true);

  // Handle initial data fetching
  const fetchInitialData = useCallback(async () => {
    if (skipInitialFetch || initialFetchComplete.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchFunction();
      
      if (isMounted.current) {
        if (result !== null && result !== undefined) {
          setData(result);
        }
        initialFetchComplete.current = true;
      }
    } catch (err) {
      console.error(`Error fetching initial data for ${channel}:`, err);
      if (isMounted.current) {
        setError(`Failed to load initial data`);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [channel, fetchFunction, skipInitialFetch]);

  // Handle WebSocket message processing
  const handleWebSocketData = useCallback((wsData: WebSocketMessage) => {
    try {
      // Process the incoming data using the provided function
      const processedData = processData(wsData);
      
      if (processedData !== null && processedData !== undefined) {
        setData(processedData);
      }
    } catch (error) {
      console.error(`Error processing WebSocket data for ${channel}:`, error);
    }
  }, [channel, processData]);

  // Subscribe to channel and fetch initial data when status changes
  useEffect(() => {
    isMounted.current = true;
    
    // Always try to fetch initial data, regardless of WebSocket status
    if (!skipInitialFetch && !initialFetchComplete.current) {
      fetchInitialData();
    }
    
    // Only subscribe if we're authenticated
    let unsubscribe = () => {};
    if (status === CONNECTION_STATES.AUTHENTICATED) {
      unsubscribe = subscribe(channel, handleWebSocketData);
    }
    
    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [
    channel, 
    status, 
    subscribe, 
    fetchInitialData, 
    handleWebSocketData, 
    skipInitialFetch
  ]);

  // Manually refresh data
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchFunction();
      
      if (isMounted.current && result !== null && result !== undefined) {
        setData(result);
      }
    } catch (err) {
      console.error(`Error refreshing data for ${channel}:`, err);
      if (isMounted.current) {
        setError('Failed to refresh data');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [channel, fetchFunction]);

  // Return the data, loading state, error state, and refresh function
  return { 
    data, 
    loading, 
    error, 
    refresh,
    isConnected: status === CONNECTION_STATES.AUTHENTICATED 
  };
}