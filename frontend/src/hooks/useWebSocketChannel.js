import { useEffect, useState, useCallback, useRef } from 'react';
import { useWebSocketManager, CONNECTION_STATES } from './useWebSocketManager';
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
export function useWebSocketChannel(channel, fetchFunction, options = {}) {
    // Default options
    const { skipInitialFetch = false, processData = (data) => (data.data || data) } = options;
    // State for data, loading status, and errors
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(!skipInitialFetch);
    const [error, setError] = useState(null);
    // Get WebSocket manager context
    const { status, subscribe } = useWebSocketManager();
    // Refs to track state without triggering re-renders
    const initialFetchComplete = useRef(false);
    const isMounted = useRef(true);
    const isSubscribed = useRef(false);
    const lastSubscriptionTime = useRef(0);
    const currentChannel = useRef(channel);
    // Store the functions and options in refs to avoid dependency changes
    const fetchFunctionRef = useRef(fetchFunction);
    const processDataRef = useRef(processData);
    const skipInitialFetchRef = useRef(skipInitialFetch);
    // Update refs when props change
    useEffect(() => {
        fetchFunctionRef.current = fetchFunction;
        processDataRef.current = processData;
        skipInitialFetchRef.current = skipInitialFetch;
        currentChannel.current = channel;
    }, [channel, fetchFunction, processData, skipInitialFetch]);
    // Handle initial data fetching
    const fetchInitialData = useCallback(async () => {
        if (skipInitialFetchRef.current || initialFetchComplete.current)
            return;
        try {
            setLoading(true);
            setError(null);
            const result = await fetchFunctionRef.current();
            if (isMounted.current) {
                if (result !== null && result !== undefined) {
                    setData(result);
                }
                initialFetchComplete.current = true;
            }
        }
        catch (err) {
            console.error(`Error fetching initial data for ${currentChannel.current}:`, err);
            if (isMounted.current) {
                setError(`Failed to load initial data`);
            }
        }
        finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, []); // Empty dependency array since we're using refs
    // Handle WebSocket message processing
    const handleWebSocketData = useCallback((wsData) => {
        try {
            // Process the incoming data using the provided function
            const processedData = processDataRef.current(wsData);
            if (processedData !== null && processedData !== undefined) {
                setData(processedData);
            }
        }
        catch (error) {
            console.error(`Error processing WebSocket data for ${currentChannel.current}:`, error);
        }
    }, []); // Empty dependency array since we're using refs
    // Subscribe to channel and fetch initial data when status changes
    useEffect(() => {
        isMounted.current = true;
        // Always try to fetch initial data, regardless of WebSocket status
        if (!skipInitialFetchRef.current && !initialFetchComplete.current) {
            fetchInitialData();
        }
        // Prevent rapid subscribe/unsubscribe cycles with a debounce mechanism
        const now = Date.now();
        if (now - lastSubscriptionTime.current < 1000) {
            console.log(`Skipping rapid channel subscription to ${currentChannel.current}`);
            return;
        }
        // Only subscribe if we're authenticated and not already subscribed
        let unsubscribe = () => { };
        if (status === CONNECTION_STATES.AUTHENTICATED && !isSubscribed.current) {
            lastSubscriptionTime.current = now;
            isSubscribed.current = true;
            console.log(`Subscribing to channel: ${currentChannel.current}`);
            unsubscribe = subscribe(currentChannel.current, handleWebSocketData);
        }
        return () => {
            if (isSubscribed.current) {
                console.log(`Unsubscribing from channel: ${currentChannel.current}`);
                isSubscribed.current = false;
                unsubscribe();
            }
        };
    }, [status, subscribe, fetchInitialData, handleWebSocketData]);
    // Clean up on unmount
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);
    // Manually refresh data
    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await fetchFunctionRef.current();
            if (isMounted.current && result !== null && result !== undefined) {
                setData(result);
            }
        }
        catch (err) {
            console.error(`Error refreshing data for ${currentChannel.current}:`, err);
            if (isMounted.current) {
                setError('Failed to refresh data');
            }
        }
        finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, []); // Empty dependency array since we're using refs
    // Return the data, loading state, error state, and refresh function
    return {
        data,
        loading,
        error,
        refresh,
        isConnected: status === CONNECTION_STATES.AUTHENTICATED
    };
}
