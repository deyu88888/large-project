import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CONNECTION_STATES, type WebSocketMessage } from '../socketConnectionManager';
import socketManagerInstance from '../socketConnectionManager';
import * as websocketUtils from '../../utils/websocket';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

class MockWebSocket {
  url: string;
  readyState: number = WebSocket.CONNECTING;
  onopen: ((this: WebSocket, ev: Event) => any) | null = null;
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
  onerror: ((this: WebSocket, ev: Event) => any) | null = null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;
  
  constructor(url: string) {
    this.url = url;
  }
  
  close(code?: number, reason?: string): void {
    const closeEvent = { 
      code: code || 1000, 
      reason: reason || '',
      wasClean: true
    } as CloseEvent;
    
    if (this.onclose) {
      this.onclose.call(this as unknown as WebSocket, closeEvent);
    }
    this.readyState = WebSocket.CLOSED;
  }
  
  send(data: string): void {
    // Mock implementation
  }
  
  mockOpen(): void {
    this.readyState = WebSocket.OPEN;
    if (this.onopen) {
      this.onopen.call(this as unknown as WebSocket, new Event('open'));
    }
  }
  
  mockClose(code: number = 1000, reason: string = '', wasClean: boolean = true): void {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      const closeEvent = { 
        code, 
        reason, 
        wasClean 
      } as CloseEvent;
      this.onclose.call(this as unknown as WebSocket, closeEvent);
    }
  }
  
  mockError(): void {
    if (this.onerror) {
      this.onerror.call(this as unknown as WebSocket, new Event('error'));
    }
  }
  
  mockMessage(data: any): void {
    if (this.onmessage) {
      const messageEvent = {
        data: typeof data === 'string' ? data : JSON.stringify(data)
      } as MessageEvent;
      this.onmessage.call(this as unknown as WebSocket, messageEvent);
    }
  }
}

// Setup mocks
vi.mock('../../utils/websocket', () => ({
  getWebSocketUrl: vi.fn(() => 'wss://test-api.example.com/ws')
}));

describe('SocketConnectionManager', () => {
  let originalWebSocket: typeof WebSocket;
  let originalConsole: typeof console;
  let originalLocalStorage: typeof localStorage;
  let originalNavigator: typeof navigator;
  let mockWs: MockWebSocket;
  
  beforeEach(() => {
    originalWebSocket = global.WebSocket;
    originalConsole = global.console;
    originalLocalStorage = global.localStorage;
    originalNavigator = global.navigator;
    
    global.WebSocket = vi.fn((url: string) => {
      mockWs = new MockWebSocket(url);
      return mockWs as unknown as WebSocket;
    }) as unknown as typeof WebSocket;
    
    global.WebSocket.CONNECTING = 0;
    global.WebSocket.OPEN = 1;
    global.WebSocket.CLOSING = 2;
    global.WebSocket.CLOSED = 3;
    
    global.console = {
      ...console,
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };
    
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    // Mock navigator.onLine
    Object.defineProperty(global.navigator, 'onLine', {
      value: true,
      writable: true
    });
    
    // Mock setTimeout and clearTimeout
    vi.useFakeTimers();
    
    // Clear all mocks between tests
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore original globals
    global.WebSocket = originalWebSocket;
    global.console = originalConsole;
    global.localStorage = originalLocalStorage;
    global.navigator = originalNavigator;
    
    // Clear fake timers
    vi.restoreAllMocks();
  });
  
  // Access the private members for testing
  function getPrivateProperties(instance: typeof socketManagerInstance) {
    return instance as unknown as {
      ws: WebSocket | null;
      status: string;
      supportedChannels: string[];
      channelSubscribers: Record<string, Array<(data: WebSocketMessage) => void>>;
      connectionAttempt: number;
      stateChangeCallbacks: Array<(state: string) => void>;
      channelListCallbacks: Array<(channels: string[]) => void>;
      debugInfo: Record<string, any>;
    };
  }
  
  describe('Initialization', () => {
    it('should initialize with disconnected state and attempt to connect', () => {
      const instance = socketManagerInstance;
      const privateProps = getPrivateProperties(instance);
      
      // Verify initial state
      expect(privateProps.status).toBe(CONNECTION_STATES.CONNECTING);
      expect(privateProps.supportedChannels).toEqual([]);
      expect(privateProps.channelSubscribers).toEqual({});
      
      // Verify that WebSocket was created with the correct URL
      expect(websocketUtils.getWebSocketUrl).toHaveBeenCalled();
      expect(global.WebSocket).toHaveBeenCalledWith('wss://test-api.example.com/ws/main/');
    });
  });
  
  describe('Connection Management', () => {
    it('should transition to CONNECTED state when the connection opens', () => {
      const instance = socketManagerInstance;
      const privateProps = getPrivateProperties(instance);
      
      // Simulate connection open
      mockWs.mockOpen();
      
      // Verify state change
      expect(privateProps.status).toBe(CONNECTION_STATES.CONNECTED);
      
      // Verify auth attempt is made (public mode since no token)
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Sending public mode authentication request')
      );
    });
    
    it('should authenticate with token when available', () => {
      const instance = socketManagerInstance;
      
      // Set token in localStorage
      localStorageMock.setItem('ACCESS_TOKEN', 'test-token');
      
      // Call connect to trigger new connection
      instance.connect();
      
      // Simulate connection open
      mockWs.mockOpen();
      
      // Verify token-based auth attempt is made
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Sending token-based authentication request')
      );
    });
    
    it('should transition to AUTHENTICATED state after successful authentication', () => {
      const instance = socketManagerInstance;
      const privateProps = getPrivateProperties(instance);
      
      // Simulate connection open
      mockWs.mockOpen();
      
      // Simulate successful auth response
      mockWs.mockMessage({
        type: 'auth_response',
        status: 'success',
        message: 'Authentication successful',
        available_channels: ['notifications', 'chat', 'updates']
      });
      
      // Verify state and channels
      expect(privateProps.status).toBe(CONNECTION_STATES.AUTHENTICATED);
      expect(privateProps.supportedChannels).toEqual(['notifications', 'chat', 'updates']);
    });
    
    it('should attempt to reconnect after connection closes abnormally', () => {
      const instance = socketManagerInstance;
      
      // Simulate connection open and then abnormal close
      mockWs.mockOpen();
      mockWs.mockClose(1006, 'Connection lost', false);
      
      // Clear previous WebSocket constructor calls
      vi.mocked(global.WebSocket).mockClear();
      
      // Advance timers to trigger reconnect
      vi.advanceTimersByTime(1000);
      
      // Verify reconnect attempt
      expect(global.WebSocket).toHaveBeenCalledWith('wss://test-api.example.com/ws/dashboard/');
    });
    
    it('should not attempt reconnect if connection closes normally', () => {
      const instance = socketManagerInstance;
      
      // Simulate connection open and then normal close
      mockWs.mockOpen();
      mockWs.mockClose(1000, 'Normal closure', true);
      
      // Clear previous WebSocket constructor calls
      vi.mocked(global.WebSocket).mockClear();
      
      // Advance timers
      vi.advanceTimersByTime(5000);
      
      // Verify no reconnect attempt for normal closure
      expect(global.WebSocket).not.toHaveBeenCalled();
    });
    
    it('should handle connection errors', () => {
      const instance = socketManagerInstance;
      const privateProps = getPrivateProperties(instance);
      
      // Simulate connection error
      mockWs.mockError();
      
      // Verify error is logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Connection error:'),
        expect.anything()
      );
      
      // Verify debug info is updated
      expect(privateProps.debugInfo.lastError.type).toBe('connection_error');
    });
    
    it('should stop attempts after MAX_CONNECTION_ATTEMPTS', () => {
      const instance = socketManagerInstance;
      const privateProps = getPrivateProperties(instance);
      
      // Force connectionAttempt to max - 1
      privateProps.connectionAttempt = 4;
      
      // Simulate connection error and close
      mockWs.mockError();
      mockWs.mockClose(1006, 'Connection failed', false);
      
      // Clear previous WebSocket constructor calls
      vi.mocked(global.WebSocket).mockClear();
      
      // Advance timers to trigger final reconnect
      vi.advanceTimersByTime(5000);
      
      // Verify final attempt
      expect(global.WebSocket).toHaveBeenCalledTimes(1);
      
      // Simulate failure of that attempt too
      mockWs.mockError();
      mockWs.mockClose(1006, 'Connection failed', false);
      
      // Clear calls again
      vi.mocked(global.WebSocket).mockClear();
      
      // Advance timers
      vi.advanceTimersByTime(10000);
      
      // Verify no more attempts
      expect(global.WebSocket).not.toHaveBeenCalled();
      expect(privateProps.status).toBe(CONNECTION_STATES.ERROR);
    });
  });
  
  describe('Channel Subscriptions', () => {
    it('should manage channel subscriptions', () => {
      const instance = socketManagerInstance;
      const privateProps = getPrivateProperties(instance);
      
      // Connect and authenticate first
      mockWs.mockOpen();
      mockWs.mockMessage({
        type: 'auth_response',
        status: 'success',
        message: 'Authentication successful',
        available_channels: ['notifications', 'chat', 'updates']
      });
      
      // Spy on the send method
      const sendSpy = vi.spyOn(mockWs, 'send');
      
      // Subscribe to a channel
      const callback = vi.fn();
      const unsubscribe = instance.subscribe('notifications', callback);
      
      // Verify subscription is added
      expect(privateProps.channelSubscribers['notifications']).toContain(callback);
      
      // Verify subscription message is sent
      expect(sendSpy).toHaveBeenCalledWith(expect.stringContaining('subscribe'));
      expect(sendSpy).toHaveBeenCalledWith(expect.stringContaining('notifications'));
      
      // Simulate message on this channel
      mockWs.mockMessage({
        type: 'update',
        channel: 'notifications',
        data: { id: 123, message: 'New notification' }
      });
      
      // Verify callback is triggered
      expect(callback).toHaveBeenCalledWith({
        type: 'update',
        channel: 'notifications',
        data: { id: 123, message: 'New notification' }
      });
      
      // Unsubscribe
      unsubscribe();
      
      // Verify subscription is removed
      expect(privateProps.channelSubscribers['notifications']).toBeUndefined();
      
      // Verify unsubscribe message is sent
      expect(sendSpy).toHaveBeenCalledWith(expect.stringContaining('unsubscribe'));
      expect(sendSpy).toHaveBeenCalledWith(expect.stringContaining('notifications'));
    });
    
    it('should handle multiple subscribers to the same channel', () => {
      const instance = socketManagerInstance;
      const privateProps = getPrivateProperties(instance);
      
      // Connect and authenticate first
      mockWs.mockOpen();
      mockWs.mockMessage({
        type: 'auth_response',
        status: 'success',
        message: 'Authentication successful'
      });
      
      // Subscribe two callbacks to the same channel
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      const unsubscribe1 = instance.subscribe('updates', callback1);
      const unsubscribe2 = instance.subscribe('updates', callback2);
      
      // Verify both callbacks are registered
      expect(privateProps.channelSubscribers['updates']).toContain(callback1);
      expect(privateProps.channelSubscribers['updates']).toContain(callback2);
      
      // Simulate message
      mockWs.mockMessage({
        type: 'update',
        channel: 'updates',
        data: { version: '1.0.1' }
      });
      
      // Verify both callbacks are triggered
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      
      // Unsubscribe just one
      unsubscribe1();
      
      // Verify only one callback remains
      expect(privateProps.channelSubscribers['updates']).not.toContain(callback1);
      expect(privateProps.channelSubscribers['updates']).toContain(callback2);
      
      // Verify channel still exists (not unsubscribed from server)
      expect(privateProps.channelSubscribers['updates']).toBeDefined();
      
      // Unsubscribe the second callback
      unsubscribe2();
      
      // Verify channel is completely removed
      expect(privateProps.channelSubscribers['updates']).toBeUndefined();
    });
    
    it('should re-subscribe to channels after reconnection', () => {
      const instance = socketManagerInstance;
      const privateProps = getPrivateProperties(instance);
      
      // Connect and authenticate
      mockWs.mockOpen();
      mockWs.mockMessage({
        type: 'auth_response',
        status: 'success',
        message: 'Authentication successful'
      });
      
      // Subscribe to a channel
      const callback = vi.fn();
      instance.subscribe('chat', callback);
      
      // Simulate connection close
      mockWs.mockClose(1006, 'Connection lost', false);
      
      // Advance timers for reconnect
      vi.advanceTimersByTime(1000);
      
      // Get the new mock WebSocket
      const newMockWs = mockWs;
      const sendSpy = vi.spyOn(newMockWs, 'send');
      
      // Simulate successful reconnection
      newMockWs.mockOpen();
      newMockWs.mockMessage({
        type: 'auth_response',
        status: 'success',
        message: 'Authentication successful'
      });
      
      // Verify re-subscription
      expect(sendSpy).toHaveBeenCalledWith(expect.stringContaining('subscribe'));
      expect(sendSpy).toHaveBeenCalledWith(expect.stringContaining('chat'));
    });
  });
  
  describe('Status and Channel List Callbacks', () => {
    it('should notify status change listeners', () => {
      const instance = socketManagerInstance;
      
      // Register status change callback
      const statusCallback = vi.fn();
      const unsubscribeStatus = instance.onStatusChange(statusCallback);
      
      // Verify immediate call with current status
      expect(statusCallback).toHaveBeenCalledWith(expect.any(String));
      
      // Simulate connection transitions
      mockWs.mockOpen();
      
      // Verify callback for connected state
      expect(statusCallback).toHaveBeenCalledWith(CONNECTION_STATES.CONNECTED);
      
      // Simulate authentication
      mockWs.mockMessage({
        type: 'auth_response',
        status: 'success',
        message: 'Authentication successful'
      });
      
      // Verify callback for authenticated state
      expect(statusCallback).toHaveBeenCalledWith(CONNECTION_STATES.AUTHENTICATED);
      
      // Unsubscribe
      unsubscribeStatus();
      
      // Clear call history
      vi.mocked(statusCallback).mockClear();
      
      // Simulate disconnect - should not trigger callback
      mockWs.mockClose(1000, 'Test close', true);
      
      // Verify no more calls after unsubscribe
      expect(statusCallback).not.toHaveBeenCalled();
    });
    
    it('should notify channel list change listeners', () => {
      const instance = socketManagerInstance;
      
      // Register channel list change callback
      const channelCallback = vi.fn();
      const unsubscribeChannels = instance.onChannelListChange(channelCallback);
      
      // Verify immediate call with current channels (empty array)
      expect(channelCallback).toHaveBeenCalledWith([]);
      
      // Clear call history
      vi.mocked(channelCallback).mockClear();
      
      // Simulate authentication with channel list
      mockWs.mockOpen();
      mockWs.mockMessage({
        type: 'auth_response',
        status: 'success',
        message: 'Authentication successful',
        available_channels: ['notifications', 'chat', 'updates']
      });
      
      // Verify callback with updated channel list
      expect(channelCallback).toHaveBeenCalledWith(['notifications', 'chat', 'updates']);
      
      // Unsubscribe
      unsubscribeChannels();
      
      // Clear call history
      vi.mocked(channelCallback).mockClear();
      
      // Simulate new channel list update - should not trigger callback
      mockWs.mockMessage({
        type: 'connection_established',
        message: 'Connected',
        available_channels: ['notifications', 'chat', 'updates', 'new_channel']
      });
      
      // Verify no more calls after unsubscribe
      expect(channelCallback).not.toHaveBeenCalled();
    });
  });
  
  describe('Utility Methods', () => {
    it('should check if a channel is supported', () => {
      const instance = socketManagerInstance;
      const privateProps = getPrivateProperties(instance);
      
      // Set supported channels
      privateProps.supportedChannels = ['notifications', 'chat', 'updates'];
      
      // Check supported channels
      expect(instance.isChannelSupported('notifications')).toBe(true);
      expect(instance.isChannelSupported('chat')).toBe(true);
      expect(instance.isChannelSupported('updates')).toBe(true);
      
      // Check unsupported channel
      expect(instance.isChannelSupported('invalid')).toBe(false);
    });
    
    it('should provide the current connection status', () => {
      const instance = socketManagerInstance;
      const privateProps = getPrivateProperties(instance);
      
      // Set status directly
      privateProps.status = CONNECTION_STATES.CONNECTED;
      
      // Verify getter returns correct status
      expect(instance.getStatus()).toBe(CONNECTION_STATES.CONNECTED);
      
      // Change status
      privateProps.status = CONNECTION_STATES.AUTHENTICATED;
      
      // Verify getter returns updated status
      expect(instance.getStatus()).toBe(CONNECTION_STATES.AUTHENTICATED);
    });
    
    it('should provide a list of supported channels', () => {
      const instance = socketManagerInstance;
      const privateProps = getPrivateProperties(instance);
      
      // Set supported channels
      privateProps.supportedChannels = ['notifications', 'chat'];
      
      // Verify getter returns correct channels
      expect(instance.getSupportedChannels()).toEqual(['notifications', 'chat']);
      
      const channels = instance.getSupportedChannels();
      channels.push('modified');
      
      expect(privateProps.supportedChannels).toEqual(['notifications', 'chat']);
    });
    
    it('should provide debug information', () => {
      const instance = socketManagerInstance;
      
      // Get debug info
      const debugInfo = instance.getDebugInfo();
      
      // Verify structure
      expect(debugInfo).toHaveProperty('status');
      expect(debugInfo).toHaveProperty('connectionAttempts');
      expect(debugInfo).toHaveProperty('messageHistory');
      expect(debugInfo).toHaveProperty('activeSubscriptions');
      expect(debugInfo).toHaveProperty('supportedChannels');
      expect(debugInfo).toHaveProperty('startTime');
      expect(debugInfo).toHaveProperty('uptime');
    });
  });
  
  describe('Manual Connection Control', () => {
    it('should disconnect when requested', () => {
      const instance = socketManagerInstance;
      const privateProps = getPrivateProperties(instance);
      
      // Ensure connected
      mockWs.mockOpen();
      
      // Spy on close method
      const closeSpy = vi.spyOn(mockWs, 'close');
      
      // Call disconnect
      instance.disconnect();
      
      // Verify WebSocket closed
      expect(closeSpy).toHaveBeenCalledWith(1000, 'User initiated disconnect');
      
      // Verify internal state
      expect(privateProps.ws).toBeNull();
      expect(privateProps.status).toBe(CONNECTION_STATES.DISCONNECTED);
    });
    
    it('should connect when requested after disconnect', () => {
      const instance = socketManagerInstance;
      const privateProps = getPrivateProperties(instance);
      
      // First disconnect
      instance.disconnect();
      
      // Clear previous WebSocket constructor calls
      vi.mocked(global.WebSocket).mockClear();
      
      // Call connect
      instance.connect();
      
      // Verify WebSocket created again
      expect(global.WebSocket).toHaveBeenCalled();
      expect(privateProps.status).toBe(CONNECTION_STATES.CONNECTING);
    });
  });
});