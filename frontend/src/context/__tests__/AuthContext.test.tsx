import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../AuthContext'; 
import { isAuthenticated, clearTokens, setAccessToken, setRefreshToken } from '../../utils/auth';

vi.mock('../../utils/auth', () => ({
  isAuthenticated: vi.fn(),
  clearTokens: vi.fn(),
  setAccessToken: vi.fn(),
  setRefreshToken: vi.fn()
}));

describe('AuthProvider', () => {
  const wrapper = ({ children }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  let storageEventListener = null;
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;

  beforeEach(() => {
    vi.clearAllMocks();

    window.addEventListener = vi.fn((event, listener) => {
      if (event === 'storage') {
        storageEventListener = listener;
      }
      return originalAddEventListener.call(window, event, listener);
    });

    window.removeEventListener = vi.fn(originalRemoveEventListener);
  });

  afterEach(() => {
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    storageEventListener = null;
  });

  it('should initialize with authentication status from isAuthenticated', () => {
    vi.mocked(isAuthenticated).mockReturnValue(true);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoggedIn).toBe(true);
    expect(isAuthenticated).toHaveBeenCalled();
  });

  it('should provide login function that sets tokens and updates isLoggedIn state', () => {
    vi.mocked(isAuthenticated).mockReturnValue(false);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoggedIn).toBe(false);

    act(() => {
      result.current.login('test-access-token', 'test-refresh-token');
    });

    expect(setAccessToken).toHaveBeenCalledWith('test-access-token');
    expect(setRefreshToken).toHaveBeenCalledWith('test-refresh-token');
    expect(result.current.isLoggedIn).toBe(true);
  });

  it('should provide logout function that clears tokens and updates isLoggedIn state', () => {
    vi.mocked(isAuthenticated).mockReturnValue(true);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoggedIn).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(clearTokens).toHaveBeenCalled();
    expect(result.current.isLoggedIn).toBe(false);
  });

  it('should update auth status when a storage event occurs (multi-tab support)', () => {
    vi.mocked(isAuthenticated).mockReturnValue(true);

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoggedIn).toBe(true);

    vi.mocked(isAuthenticated).mockReturnValue(false);

    act(() => {
      expect(storageEventListener).not.toBeNull();

      if (storageEventListener) {
        storageEventListener(new StorageEvent('storage'));
      }
    });

    expect(result.current.isLoggedIn).toBe(false);
  });

  it('should clean up storage event listener on unmount', () => {
    const { unmount } = renderHook(() => useAuth(), { wrapper });

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('storage', expect.any(Function));
  });

  it('should render children within the auth context', () => {
    render(
      <AuthProvider>
        <div data-testid="child-element">Child content</div>
      </AuthProvider>
    );

    expect(screen.getByTestId('child-element')).toBeInTheDocument();
  });

  it('should expose context through useAuth hook', () => {
    const TestComponent = () => {
      const auth = useAuth();
      return (
        <div>
          <span data-testid="logged-in-status">{auth.isLoggedIn.toString()}</span>
          <button 
            data-testid="login-button" 
            onClick={() => auth.login('access', 'refresh')}
          >
            Login
          </button>
          <button 
            data-testid="logout-button" 
            onClick={auth.logout}
          >
            Logout
          </button>
        </div>
      );
    };

    vi.mocked(isAuthenticated).mockReturnValue(false);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('logged-in-status').textContent).toBe('false');

    act(() => {
      screen.getByTestId('login-button').click();
    });

    expect(setAccessToken).toHaveBeenCalledWith('access');
    expect(setRefreshToken).toHaveBeenCalledWith('refresh');
    expect(screen.getByTestId('logged-in-status').textContent).toBe('true');

    act(() => {
      screen.getByTestId('logout-button').click();
    });

    expect(clearTokens).toHaveBeenCalled();
    expect(screen.getByTestId('logged-in-status').textContent).toBe('false');
  });
});