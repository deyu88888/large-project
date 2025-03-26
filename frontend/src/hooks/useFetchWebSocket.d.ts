/**
 * Helper function to fetch data and update state
 */
export declare const fetchData: <T>(setData: (data: T[]) => void, fetchDataFunction: () => Promise<T[]>) => Promise<void>;
/**
 * Helper function to handle WebSocket messages
 */
export declare const handleMessage: <T>(setData: (data: T[]) => void, fetchDataFunction: () => Promise<T[]>) => Promise<void>;
/**
 * Helper function to handle WebSocket errors
 */
export declare const handleError: (event: Event) => void;
/**
 * Helper function to handle WebSocket connections
 */
export declare const handleClose: <T>(setData: (data: T[]) => void, ws: React.MutableRefObject<WebSocket | null>, fetchDataFunction: () => Promise<T[]>, sourceURL: string, timeoutRef: React.MutableRefObject<number | null>, maxAttempts: React.MutableRefObject<number>) => void;
/**
 * Function to connect to WebSocket
 */
export declare const connectWebSocket: <T>(setData: (data: T[]) => void, ws: React.MutableRefObject<WebSocket | null>, fetchDataFunction: () => Promise<T[]>, sourceURL: string, timeoutRef: React.MutableRefObject<number | null>, maxAttempts: React.MutableRefObject<number>) => (() => void);
/**
 * Legacy hook to fetch data via WebSocket
 * @deprecated Use useWebSocketChannel instead for better connection management
 */
export declare const useFetchWebSocket: <T>(fetchDataFunction: () => Promise<T[]>, sourceURL: string) => T[];
