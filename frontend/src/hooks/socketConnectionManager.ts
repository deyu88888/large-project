// socketConnectionManager.ts
import { ACCESS_TOKEN } from '../constants';

// Define types for WebSocket message data
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
export const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  AUTHENTICATED: 'authenticated',
  AUTH_FAILED: 'auth-failed',
  ERROR: 'error'
} as const;

export type ConnectionState = typeof CONNECTION_STATES[keyof typeof CONNECTION_STATES];

/**
 * Helper function to get explanation for WebSocket close codes
 */
function getCloseEventCodeExplanation(code: number): string {
  const explanations: Record<number, string> = {
    1000: "Normal closure (successful operation)",
    1001: "Going away (client/server disconnecting)",
    1002: "Protocol error",
    1003: "Unsupported data",
    1004: "Reserved",
    1005: "No status received (internal use)",
    1006: "Abnormal closure (connection failed)",
    1007: "Invalid frame payload data",
    1008: "Policy violation",
    1009: "Message too big",
    1010: "Mandatory extension missing",
    1011: "Internal server error",
    1012: "Service restart",
    1013: "Try again later",
    1014: "Bad gateway",
    1015: "TLS handshake failure"
  };
  return explanations[code] || "Unknown code";
}

// Singleton WebSocket connection manager
class SocketConnectionManager {
  private static instance: SocketConnectionManager;
  private ws: WebSocket | null = null;
  private status: ConnectionState = CONNECTION_STATES.DISCONNECTED;
  private supportedChannels: string[] = [];
  private channelSubscribers: Record<string, Array<(data: WebSocketMessage) => void>> = {};
  private connectionAttempt: number = 0;
  private MAX_CONNECTION_ATTEMPTS: number = 5;
  private reconnectTimeout: number | null = null;
  private connectionTimeout: number | null = null;
  private stateChangeCallbacks: Array<(state: ConnectionState) => void> = [];
  private channelListCallbacks: Array<(channels: string[]) => void> = [];
  private debugInfo: Record<string, any> = {
    connectionAttempts: [],
    lastError: null,
    messageHistory: [],
    backendVersion: null,
    startTime: new Date().toISOString(),
    connectionEvents: []
  };

  private constructor() {
    // Private constructor to enforce singleton
    console.log('[WebSocket Singleton] Initializing global WebSocket manager');
    
    // Expose debug info
    (window as any).__websocketDebug = {
      getStatus: () => this.status,
      getConnectionAttempts: () => this.debugInfo.connectionAttempts,
      getLastError: () => this.debugInfo.lastError,
      getMessageHistory: () => this.debugInfo.messageHistory,
      getActiveSubscriptions: () => Object.keys(this.channelSubscribers),
      getSupportedChannels: () => this.supportedChannels,
      forceReconnect: () => {
        this.disconnect();
        this.connectionAttempt = 0;
        this.connect();
      },
      getFullDebugInfo: () => this.getDebugInfo()
    };

    // Auto-connect on initialization
    this.connect();
  }

  public static getInstance(): SocketConnectionManager {
    if (!SocketConnectionManager.instance) {
      SocketConnectionManager.instance = new SocketConnectionManager();
    }
    return SocketConnectionManager.instance;
  }

  private logWithTime(level: 'log' | 'warn' | 'error', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [WebSocket Debug] ${message}`;
    
    if (data) {
      console[level](logMessage, data);
      this.debugInfo.connectionEvents.push({
        level,
        message,
        data,
        timestamp
      });
    } else {
      console[level](logMessage);
      this.debugInfo.connectionEvents.push({
        level,
        message,
        timestamp
      });
    }
  }

  private safeSend(message: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logWithTime('warn', `Cannot send message - WebSocket not connected`, {
        readyState: this.ws ? this.ws.readyState : 'null',
        message
      });
      return false;
    }
    
    try {
      this.ws.send(JSON.stringify(message));
      this.debugInfo.messageHistory.push({
        direction: 'outgoing',
        message,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      this.logWithTime('error', `Error sending message`, { error, message });
      return false;
    }
  }

  private authenticate(token: string | null = null): void {
    if (!token) {
      // Public access mode
      this.logWithTime('log', 'Sending public mode authentication request');
      
      const authMessage = { 
        type: 'authenticate',
        mode: 'public'
      };
      
      if (this.safeSend(authMessage)) {
        this.logWithTime('log', 'Public access authentication request sent');
      }
      
      return;
    }
    
    // Token-based authentication
    this.logWithTime('log', 'Sending token-based authentication request');
    
    const authMessage = {
      type: 'authenticate',
      token
    };
    
    if (this.safeSend({ ...authMessage, token: '***' })) { // Log sanitized version
      this.logWithTime('log', 'Authentication request sent with token');
    }
  }

  private createWebSocketConnection(url: string): WebSocket {
    this.logWithTime('log', `Creating new WebSocket connection to ${url}`);
    
    const newWs = new WebSocket(url);
    
    // Set a connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    
    this.connectionTimeout = window.setTimeout(() => {
      if (newWs.readyState === WebSocket.CONNECTING) {
        this.logWithTime('error', `Connection to ${url} timed out after 10 seconds`);
        
        // Force close and try again
        try {
          newWs.close(1006, 'Connection timeout');
        } catch (e) {
          // Ignore errors when closing a connecting socket
        }
      }
    }, 10000); // 10 second timeout
    
    return newWs;
  }

  public connect(): void {
    // Check if network is available
    if (!navigator.onLine) {
      this.logWithTime('error', 'Network unavailable, cannot connect');
      this.setStatus(CONNECTION_STATES.ERROR);
      this.debugInfo.lastError = {
        type: 'network_unavailable',
        timestamp: new Date().toISOString()
      };
      return;
    }

    // Don't attempt to connect if we're already connected or connecting
    if (
      this.ws && 
      (this.ws.readyState === WebSocket.CONNECTING || 
       this.ws.readyState === WebSocket.OPEN)
    ) {
      this.logWithTime('log', 'Already connecting or connected, skipping connect call', {
        readyState: this.ws.readyState,
        status: this.status
      });
      return;
    }
    
    // If this is a new connection attempt from DISCONNECTED state, reset the counter
    if (this.status === CONNECTION_STATES.DISCONNECTED && this.connectionAttempt > 1) {
      this.logWithTime('log', 'Starting fresh connection sequence, resetting attempt counter');
      this.connectionAttempt = 0;
    }
    
    // Increment connection attempt
    this.connectionAttempt++;
    
    // Check if we've exceeded max attempts
    if (this.connectionAttempt > this.MAX_CONNECTION_ATTEMPTS) {
      this.logWithTime('error', `Maximum connection attempts (${this.MAX_CONNECTION_ATTEMPTS}) reached. Giving up.`);
      this.setStatus(CONNECTION_STATES.ERROR);
      this.debugInfo.lastError = {
        type: 'max_attempts_reached',
        attempts: this.connectionAttempt,
        timestamp: new Date().toISOString()
      };
      return;
    }
    
    this.debugInfo.connectionAttempts.push({
      attempt: this.connectionAttempt,
      timestamp: new Date().toISOString()
    });
    
    // Get authentication token
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      this.logWithTime('log', 'No authentication token available - using public access mode');
    } else {
      this.logWithTime('log', 'Authentication token found');
    }
    
    try {
      // Set state to connecting
      this.setStatus(CONNECTION_STATES.CONNECTING);
      
      // Clean up any existing connection
      if (this.ws) {
        try {
          this.ws.onopen = null;
          this.ws.onclose = null;
          this.ws.onerror = null;
          this.ws.onmessage = null;
          this.ws.close(1000, 'Creating new connection');
        } catch (e) {
          this.logWithTime('warn', 'Error closing existing connection', e);
        }
        this.ws = null;
      }
      
      // Clear any pending reconnects
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      // Determine WebSocket URL - use environment variable if available
      let baseUrl;
      
      // Check if we're using Vite
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        baseUrl = import.meta.env.VITE_WEBSOCKET_ADMIN_BASE_URL;
      }
      
      // Fallback URL logic
      if (!baseUrl) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        
        // Use port 8000 for localhost, otherwise use the same port as the current page
        const port = (host === 'localhost' || host === '127.0.0.1') 
          ? '8000' 
          : window.location.port;
        
        baseUrl = `${protocol}//${host}${port ? ':' + port : ''}/ws`;
      }
      
      // Determine endpoint based on connection attempt
      const endpoints = ['main', 'dashboard', 'echo', 'test-connection'];
      const endpointIndex = Math.min(this.connectionAttempt - 1, endpoints.length - 1);
      const endpoint = endpoints[endpointIndex];
      const socketUrl = `${baseUrl}/${endpoint}/`;
      
      this.logWithTime('log', `Attempting to connect to: ${socketUrl} (attempt ${this.connectionAttempt}/${this.MAX_CONNECTION_ATTEMPTS})`);
      
      // Create new WebSocket connection
      this.ws = this.createWebSocketConnection(socketUrl);
      
      // Handle successful connection
      this.ws.onopen = () => {
        // Clear connection timeout
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        this.logWithTime('log', `WebSocket connection established successfully to ${socketUrl}`);
        this.setStatus(CONNECTION_STATES.CONNECTED);
        
        // Authenticate immediately after connection
        if (token) {
          this.authenticate(token);
        } else {
          // Use public access mode
          this.authenticate(null);
        }
      };
      
      // Handle connection close
      this.ws.onclose = (event) => {
        // Clear connection timeout
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        this.logWithTime('log', `Connection closed: Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}, Clean: ${event.wasClean}`, {
          explanation: getCloseEventCodeExplanation(event.code)
        });
        
        this.debugInfo.lastError = {
          type: 'connection_closed',
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          explanation: getCloseEventCodeExplanation(event.code),
          timestamp: new Date().toISOString()
        };
        
        this.setStatus(CONNECTION_STATES.DISCONNECTED);
        
        // If not a normal closure, attempt to reconnect after a delay
        // (unless we're at max attempts)
        if (
          event.code !== 1000 && 
          this.connectionAttempt < this.MAX_CONNECTION_ATTEMPTS
        ) {
          const delay = Math.min(1000 * Math.pow(1.5, this.connectionAttempt), 15000);
          this.logWithTime('log', `Scheduling reconnect in ${delay}ms (attempt ${this.connectionAttempt + 1}/${this.MAX_CONNECTION_ATTEMPTS})`);
          
          if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
          }
          
          this.reconnectTimeout = window.setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
          }, delay);
        }
      };
      
      // Handle connection errors
      this.ws.onerror = (error) => {
        this.logWithTime('error', 'Connection error:', error);
        
        // Get some details from the event
        if (error instanceof Event) {
          this.logWithTime('error', 'Error Event details:', {
            bubbles: error.bubbles,
            cancelable: error.cancelable,
            eventPhase: error.eventPhase,
            isTrusted: error.isTrusted,
            target: error.target ? 'present' : 'null'
          });
        }
        
        this.debugInfo.lastError = {
          type: 'connection_error',
          error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          timestamp: new Date().toISOString()
        };
        
        // Don't set to ERROR here - onclose will be called next
        // and will trigger reconnection
      };
      
      // Handle incoming messages
      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          this.logWithTime('log', 'Message received:', data);
          
          this.debugInfo.messageHistory.push({
            direction: 'incoming',
            message: data,
            timestamp: new Date().toISOString()
          });
          
          // Handle authentication response
          if (data.type === 'auth_response') {
            if (data.status === 'success') {
              this.logWithTime('log', 'Authentication successful:', data.message);
              this.setStatus(CONNECTION_STATES.AUTHENTICATED);
              
              // Store supported channels if provided
              if (data.available_channels) {
                this.setSupportedChannels(data.available_channels);
                this.logWithTime('log', 'Available channels updated:', data.available_channels);
              }
              
              // Re-subscribe to all active channels
              const activeChannels = Object.keys(this.channelSubscribers);
              if (activeChannels.length > 0) {
                this.logWithTime('log', `Re-subscribing to ${activeChannels.length} active channels`);
                
                activeChannels.forEach(channel => {
                  if (this.channelSubscribers[channel].length > 0) {
                    const subscribeMsg = {
                      type: 'subscribe',
                      channel
                    };
                    
                    if (this.safeSend(subscribeMsg)) {
                      this.logWithTime('log', `Re-subscribed to channel: ${channel}`);
                    }
                  }
                });
              }
            } else {
              this.logWithTime('error', 'Authentication failed:', data.message);
              
              // For public dashboard with no token, don't set AUTH_FAILED state
              if (!localStorage.getItem(ACCESS_TOKEN)) {
                this.logWithTime('log', 'Public access mode - ignoring auth failure and trying again with explicit public mode');
                this.authenticate(null);
              } else {
                this.setStatus(CONNECTION_STATES.AUTH_FAILED);
                
                this.debugInfo.lastError = {
                  type: 'auth_failed',
                  message: data.message,
                  timestamp: new Date().toISOString()
                };
              }
            }
            return;
          }
          
          // Handle connection_established messages
          if (data.type === 'connection_established') {
            this.logWithTime('log', 'Server confirmed connection:', data.message);
            
            // Store backend version if available
            if (data.version) {
              this.debugInfo.backendVersion = data.version;
            }
            
            // Store available channels
            if (data.available_channels) {
              this.setSupportedChannels(data.available_channels);
              this.logWithTime('log', 'Available channels:', data.available_channels);
            }
            
            return;
          }
          
          // Handle channel data
          if (data.channel && this.channelSubscribers[data.channel]) {
            this.logWithTime('log', `Received data for channel ${data.channel}`);
            
            // Notify all subscribers to this channel
            this.channelSubscribers[data.channel].forEach(callback => {
              try {
                callback(data);
              } catch (callbackError) {
                this.logWithTime('error', `Error in channel ${data.channel} callback:`, callbackError);
              }
            });
          }
        } catch (error) {
          this.logWithTime('error', 'Error processing WebSocket message:', { 
            error,
            rawMessage: typeof event.data === 'string' 
              ? (event.data.length > 100 ? event.data.slice(0, 100) + '...' : event.data) 
              : 'binary data'
          });
          
          this.debugInfo.lastError = {
            type: 'message_processing_error',
            error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
            timestamp: new Date().toISOString()
          };
        }
      };
    } catch (error) {
      this.logWithTime('error', 'Failed to create WebSocket connection:', error);
      
      this.debugInfo.lastError = {
        type: 'connection_creation_error',
        error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        timestamp: new Date().toISOString()
      };
      
      this.setStatus(CONNECTION_STATES.ERROR);
      
      // Schedule a reconnect if not at max attempts
      if (this.connectionAttempt < this.MAX_CONNECTION_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(1.5, this.connectionAttempt), 15000);
        this.logWithTime('log', `Error during connection creation. Scheduling reconnect in ${delay}ms`);
        
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
        }
        
        this.reconnectTimeout = window.setTimeout(() => {
          this.reconnectTimeout = null;
          this.connect();
        }, delay);
      }
    }
  }

  public disconnect(): void {
    this.logWithTime('log', 'Manual disconnect initiated');
    
    // Clear any reconnection timers
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Clear any connection timers
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // Close the connection
    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.onmessage = null;
        this.ws.close(1000, 'User initiated disconnect');
      } catch (e) {
        this.logWithTime('warn', 'Error during manual disconnect', e);
      }
      this.ws = null;
    }
    
    this.setStatus(CONNECTION_STATES.DISCONNECTED);
  }

  public subscribe(channel: string, callback: (data: WebSocketMessage) => void): () => void {
    this.logWithTime('log', `Subscribing to channel: ${channel}, connection status: ${this.status}`);
    
    // Add a simple subscription debounce mechanism
    const now = Date.now();
    const lastSubscriptionKey = `lastSubscription_${channel}`;
    const lastSubscriptionTime = (this as any)[lastSubscriptionKey] || 0;
    
    // Initialize channel array if needed
    if (!this.channelSubscribers[channel]) {
      this.channelSubscribers[channel] = [];
      
      // Send subscription request if connected and not recently subscribed
      if (this.status === CONNECTION_STATES.AUTHENTICATED) {
        const subscribeMsg = {
          type: 'subscribe',
          channel
        };
        
        // Only send if we haven't sent a subscription for this channel recently (within 1 second)
        if (now - lastSubscriptionTime > 1000) {
          if (this.safeSend(subscribeMsg)) {
            this.logWithTime('log', `Sent subscription request for channel: ${channel}`);
            (this as any)[lastSubscriptionKey] = now;
          }
        } else {
          this.logWithTime('log', `Skipping duplicate subscription request for ${channel} (sent ${now - lastSubscriptionTime}ms ago)`);
        }
      } else {
        this.logWithTime('warn', `Not sending subscription request for ${channel} - status: ${this.status}`);
      }
    } else {
      this.logWithTime('log', `Channel ${channel} already has subscribers, adding callback only`);
    }
    
    // Add callback to channel subscribers
    this.channelSubscribers[channel].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.logWithTime('log', `Unsubscribing from channel: ${channel}`);
      
      if (this.channelSubscribers[channel]) {
        // Remove this callback
        this.channelSubscribers[channel] = this.channelSubscribers[channel].filter(
          cb => cb !== callback
        );
        
        // If no more subscribers, unsubscribe from server
        if (this.channelSubscribers[channel].length === 0) {
          delete this.channelSubscribers[channel];
          
          const now = Date.now();
          const lastUnsubscriptionKey = `lastUnsubscription_${channel}`;
          const lastUnsubscriptionTime = (this as any)[lastUnsubscriptionKey] || 0;
          
          if (this.status === CONNECTION_STATES.AUTHENTICATED) {
            const unsubscribeMsg = {
              type: 'unsubscribe',
              channel
            };
            
            // Only send if we haven't sent an unsubscription for this channel recently
            if (now - lastUnsubscriptionTime > 1000) {
              if (this.safeSend(unsubscribeMsg)) {
                this.logWithTime('log', `Sent unsubscribe request for channel: ${channel}`);
                (this as any)[lastUnsubscriptionKey] = now;
              }
            } else {
              this.logWithTime('log', `Skipping duplicate unsubscription request for ${channel} (sent ${now - lastUnsubscriptionTime}ms ago)`);
            }
          }
        } else {
          this.logWithTime('log', `Channel ${channel} still has ${this.channelSubscribers[channel].length} subscribers, not unsubscribing from server`);
        }
      }
    };
  }

  public isChannelSupported(channel: string): boolean {
    return this.supportedChannels.includes(channel);
  }

  public getDebugInfo(): any {
    return {
      status: this.status,
      connectionAttempts: this.debugInfo.connectionAttempts,
      connectionEvents: this.debugInfo.connectionEvents.slice(-50), // Last 50 events
      lastError: this.debugInfo.lastError,
      messageHistory: this.debugInfo.messageHistory.slice(-20), // Last 20 messages
      activeSubscriptions: Object.keys(this.channelSubscribers),
      supportedChannels: this.supportedChannels,
      backendVersion: this.debugInfo.backendVersion,
      startTime: this.debugInfo.startTime,
      uptime: Math.floor((Date.now() - new Date(this.debugInfo.startTime).getTime()) / 1000) + ' seconds'
    };
  }

  public getStatus(): ConnectionState {
    return this.status;
  }

  public getSupportedChannels(): string[] {
    return [...this.supportedChannels];
  }

  private setStatus(newStatus: ConnectionState): void {
    if (newStatus !== this.status) {
      this.logWithTime('log', `Status changed to: ${newStatus}`);
      this.status = newStatus;
      
      // Notify all status change callbacks
      this.stateChangeCallbacks.forEach(callback => {
        try {
          callback(newStatus);
        } catch (error) {
          this.logWithTime('error', 'Error in status change callback:', error);
        }
      });
    }
  }

  private setSupportedChannels(channels: string[]): void {
    this.supportedChannels = channels;
    
    // Notify all channel list callbacks
    this.channelListCallbacks.forEach(callback => {
      try {
        callback(channels);
      } catch (error) {
        this.logWithTime('error', 'Error in channel list callback:', error);
      }
    });
  }

  public onStatusChange(callback: (state: ConnectionState) => void): () => void {
    this.stateChangeCallbacks.push(callback);
    
    // Call immediately with current status
    callback(this.status);
    
    // Return unsubscribe function
    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  public onChannelListChange(callback: (channels: string[]) => void): () => void {
    this.channelListCallbacks.push(callback);
    
    // Call immediately with current channels
    callback(this.supportedChannels);
    
    // Return unsubscribe function
    return () => {
      this.channelListCallbacks = this.channelListCallbacks.filter(cb => cb !== callback);
    };
  }
}

// Create the singleton instance
const socketManagerInstance = SocketConnectionManager.getInstance();

// Export the instance as default
export default socketManagerInstance;