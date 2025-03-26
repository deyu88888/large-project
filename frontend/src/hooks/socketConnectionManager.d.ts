export interface WebSocketMessage {
    type: string;
    channel?: string;
    data?: any;
    status?: string;
    message?: string;
    available_channels?: string[];
    [key: string]: any;
}
/**
 * WebSocket connection states
 */
export declare const CONNECTION_STATES: {
    readonly DISCONNECTED: "disconnected";
    readonly CONNECTING: "connecting";
    readonly CONNECTED: "connected";
    readonly AUTHENTICATED: "authenticated";
    readonly AUTH_FAILED: "auth-failed";
    readonly ERROR: "error";
};
export type ConnectionState = typeof CONNECTION_STATES[keyof typeof CONNECTION_STATES];
declare class SocketConnectionManager {
    private static instance;
    private ws;
    private status;
    private supportedChannels;
    private channelSubscribers;
    private connectionAttempt;
    private MAX_CONNECTION_ATTEMPTS;
    private reconnectTimeout;
    private connectionTimeout;
    private stateChangeCallbacks;
    private channelListCallbacks;
    private debugInfo;
    private constructor();
    static getInstance(): SocketConnectionManager;
    private logWithTime;
    private safeSend;
    private authenticate;
    private createWebSocketConnection;
    connect(): void;
    disconnect(): void;
    subscribe(channel: string, callback: (data: WebSocketMessage) => void): () => void;
    isChannelSupported(channel: string): boolean;
    getDebugInfo(): any;
    getStatus(): ConnectionState;
    getSupportedChannels(): string[];
    private setStatus;
    private setSupportedChannels;
    onStatusChange(callback: (state: ConnectionState) => void): () => void;
    onChannelListChange(callback: (channels: string[]) => void): () => void;
}
declare const socketManagerInstance: SocketConnectionManager;
export default socketManagerInstance;
