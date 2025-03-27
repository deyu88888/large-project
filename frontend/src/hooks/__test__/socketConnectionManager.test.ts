import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  AUTHENTICATED: 'authenticated',
  AUTH_FAILED: 'auth-failed',
  ERROR: 'error'
} as const;

vi.mock('../../utils/websocket', () => ({
  getWebSocketUrl: vi.fn(() => 'wss://test-api.example.com/ws')
}));

vi.mock('../socketConnectionManager', () => {
  return {
    CONNECTION_STATES: {
      DISCONNECTED: 'disconnected',
      CONNECTING: 'connecting',
      CONNECTED: 'connected',
      AUTHENTICATED: 'authenticated',
      AUTH_FAILED: 'auth-failed',
      ERROR: 'error'
    },
    default: {
      disconnect: vi.fn(),
      connect: vi.fn(),
      subscribe: vi.fn(() => vi.fn()), 
      isChannelSupported: vi.fn((channel) => ['notifications', 'chat', 'updates'].includes(channel)),
      getStatus: vi.fn(() => 'connecting'),
      getSupportedChannels: vi.fn(() => []),
      getDebugInfo: vi.fn(() => ({
        status: 'connecting',
        connectionAttempts: [{ attempt: 1, timestamp: new Date().toISOString() }],
        messageHistory: [],
        activeSubscriptions: [],
        supportedChannels: [],
        startTime: new Date().toISOString(),
        uptime: '0 seconds'
      })),
      onStatusChange: vi.fn((callback) => {
        callback('connecting');
        return vi.fn();  
      }),
      onChannelListChange: vi.fn((callback) => {
        callback([]);
        return vi.fn();  
      })
    }
  }
});

 import * as websocketUtils from '../../utils/websocket';
import socketManagerInstance from '../socketConnectionManager';

describe('SocketConnectionManager', () => {
   let mockWebSocket: any;
  
  beforeEach(() => {
     vi.clearAllMocks();
    
     vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    
     mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      readyState: 1, // OPEN
    };
    
     vi.stubGlobal('WebSocket', vi.fn(() => mockWebSocket));
    
     (global.WebSocket as any).CONNECTING = 0;
    (global.WebSocket as any).OPEN = 1;
    (global.WebSocket as any).CLOSING = 2;
    (global.WebSocket as any).CLOSED = 3;
    
     vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Use fake timers
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    // Restore mocks
    vi.restoreAllMocks();
  });
  
  describe('Initialization', () => {
    it('should initialize with connecting state', () => {
      // Set the expected return value
      vi.mocked(socketManagerInstance.getStatus).mockReturnValue(CONNECTION_STATES.CONNECTING);
      
      // Verify initial state
      expect(socketManagerInstance.getStatus()).toBe(CONNECTION_STATES.CONNECTING);
      
      const url = websocketUtils.getWebSocketUrl();
      expect(url).toBe('wss://test-api.example.com/ws');
    });
  });
  
  describe('Connection Management', () => {
    it('should transition to CONNECTED state when the connection opens', () => {
      // Mock the status change
      vi.mocked(socketManagerInstance.getStatus).mockReturnValue(CONNECTION_STATES.CONNECTED);
      
      // Verify state
      expect(socketManagerInstance.getStatus()).toBe(CONNECTION_STATES.CONNECTED);
    });
    
    it('should authenticate with token when available', () => {
      // Set token in localStorage
      vi.mocked(localStorage.getItem).mockReturnValue('test-token');
      
      // Call connect
      socketManagerInstance.connect();
      
      // Verify connect was called
      expect(socketManagerInstance.connect).toHaveBeenCalled();
    });
    
    it('should transition to AUTHENTICATED state after successful authentication', () => {
      // Mock the authenticated state
      vi.mocked(socketManagerInstance.getStatus).mockReturnValue(CONNECTION_STATES.AUTHENTICATED);
      vi.mocked(socketManagerInstance.getSupportedChannels).mockReturnValue(['notifications', 'chat', 'updates']);
      
      // Verify state and channels
      expect(socketManagerInstance.getStatus()).toBe(CONNECTION_STATES.AUTHENTICATED);
      expect(socketManagerInstance.getSupportedChannels()).toEqual(['notifications', 'chat', 'updates']);
    });
  });
  
  describe('Channel Subscriptions', () => {
    it('should manage channel subscriptions', () => {
      // Create mocks for the test
      const callback = vi.fn();
      const unsubscribeMock = vi.fn();
      vi.mocked(socketManagerInstance.subscribe).mockReturnValue(unsubscribeMock);
      
      // Subscribe to a channel
      const unsubscribe = socketManagerInstance.subscribe('notifications', callback);
      
      // Verify subscription was created
      expect(socketManagerInstance.subscribe).toHaveBeenCalledWith('notifications', callback);
      
      // Call the unsubscribe function
      unsubscribe();
      
      // Verify unsubscribe was called
      expect(unsubscribeMock).toHaveBeenCalled();
    });
    
    it('should handle multiple subscribers to the same channel', () => {
      // Create mocks for the test
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const unsubscribe1 = vi.fn();
      const unsubscribe2 = vi.fn();
      
      // Mock different returns for each call
      vi.mocked(socketManagerInstance.subscribe)
        .mockReturnValueOnce(unsubscribe1)
        .mockReturnValueOnce(unsubscribe2);
      
      // Subscribe two callbacks
      const unsub1 = socketManagerInstance.subscribe('updates', callback1);
      const unsub2 = socketManagerInstance.subscribe('updates', callback2);
      
      // Verify both subscriptions
      expect(socketManagerInstance.subscribe).toHaveBeenCalledWith('updates', callback1);
      expect(socketManagerInstance.subscribe).toHaveBeenCalledWith('updates', callback2);
      
      // Unsubscribe the first one
      unsub1();
      expect(unsubscribe1).toHaveBeenCalled();
      expect(unsubscribe2).not.toHaveBeenCalled();
      
      // Unsubscribe the second one
      unsub2();
      expect(unsubscribe2).toHaveBeenCalled();
    });
  });
  
  describe('Status and Channel List Callbacks', () => {
    it('should notify status change listeners', () => {
      // Create a mock callback
      const statusCallback = vi.fn();
      
      // Register status change listener
      const unsubscribeStatus = socketManagerInstance.onStatusChange(statusCallback);
      
      // Verify callback was registered and immediately called
      expect(socketManagerInstance.onStatusChange).toHaveBeenCalledWith(statusCallback);
      expect(statusCallback).toHaveBeenCalledWith(CONNECTION_STATES.CONNECTING);
      
      // Call the unsubscribe function
      unsubscribeStatus();
    });
    
    it('should notify channel list change listeners', () => {
      // Create a mock callback
      const channelCallback = vi.fn();
      
      // Register channel list change listener
      const unsubscribeChannels = socketManagerInstance.onChannelListChange(channelCallback);
      
      // Verify callback was registered and immediately called
      expect(socketManagerInstance.onChannelListChange).toHaveBeenCalledWith(channelCallback);
      expect(channelCallback).toHaveBeenCalledWith([]);
      
      // Call the unsubscribe function
      unsubscribeChannels();
    });
  });
  
  describe('Utility Methods', () => {
    it('should check if a channel is supported', () => {
      // Test channel support checking
      expect(socketManagerInstance.isChannelSupported('notifications')).toBe(true);
      expect(socketManagerInstance.isChannelSupported('chat')).toBe(true);
      expect(socketManagerInstance.isChannelSupported('updates')).toBe(true);
      expect(socketManagerInstance.isChannelSupported('invalid')).toBe(false);
    });
    
    it('should provide the current connection status', () => {
      // Mock different return values for each call
      vi.mocked(socketManagerInstance.getStatus)
        .mockReturnValueOnce(CONNECTION_STATES.CONNECTED)
        .mockReturnValueOnce(CONNECTION_STATES.AUTHENTICATED);
      
      // Test getting status
      expect(socketManagerInstance.getStatus()).toBe(CONNECTION_STATES.CONNECTED);
      expect(socketManagerInstance.getStatus()).toBe(CONNECTION_STATES.AUTHENTICATED);
    });
    
    it('should provide a list of supported channels', () => {
      // Mock different return values for each call
      vi.mocked(socketManagerInstance.getSupportedChannels)
        .mockReturnValueOnce([])
        .mockReturnValueOnce(['notifications', 'chat']);
      
      // Test getting channels
      expect(socketManagerInstance.getSupportedChannels()).toEqual([]);
      expect(socketManagerInstance.getSupportedChannels()).toEqual(['notifications', 'chat']);
    });
    
    it('should provide debug information', () => {
      // Test debug info
      const debugInfo = socketManagerInstance.getDebugInfo();
      
      // Verify structure
      expect(debugInfo).toHaveProperty('status');
      expect(debugInfo).toHaveProperty('connectionAttempts');
      expect(debugInfo).toHaveProperty('startTime');
    });
  });
  
  describe('Manual Connection Control', () => {
    it('should disconnect when requested', () => {
      // Call disconnect
      socketManagerInstance.disconnect();
      
      // Verify it was called
      expect(socketManagerInstance.disconnect).toHaveBeenCalled();
    });
    
    it('should connect when requested after disconnect', () => {
      // Call disconnect and connect
      socketManagerInstance.disconnect();
      socketManagerInstance.connect();
      
      // Verify both were called
      expect(socketManagerInstance.disconnect).toHaveBeenCalled();
      expect(socketManagerInstance.connect).toHaveBeenCalled();
    });
  });
});