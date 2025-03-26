import { WebSocketMessage } from './useWebSocketManager';
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
export declare function useWebSocketChannel<T>(channel: string, fetchFunction: () => Promise<T | null>, options?: WebSocketChannelOptions<T>): WebSocketChannelResult<T>;
export {};
