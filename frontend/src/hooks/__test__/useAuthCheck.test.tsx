import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import useAuthCheck from '../useAuthCheck';
import { apiClient } from '../../api';
import { useAuthStore } from '../../stores/auth-store';
import { ACCESS_TOKEN } from '../../constants';

vi.mock('../../api');

const setUserMock = vi.fn();
let mockStoreState = { user: null, setUser: setUserMock };

vi.mock('../../stores/auth-store', () => ({
    useAuthStore: vi.fn((selector) => {
        const state = mockStoreState;
        if (selector) {
            return selector(state);
        }
        return state;
    }),
}));

const localStorageMock = (() => {
    let store: Record<string, string | null> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();
vi.stubGlobal('localStorage', localStorageMock);

// --- Tests ---
describe('useAuthCheck', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStoreState = { user: null, setUser: setUserMock };
        localStorageMock.clear();
        localStorageMock.setItem(ACCESS_TOKEN, 'fake-token'); // Default token presence

        // **Add Default Pending Mock for API to prevent background errors**
        // Tests needing specific API responses will override this with mockResolvedValue/mockRejectedValue
        vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    });

    afterEach(() => {
        // Optional: Explicitly clear mocks if needed, though clearAllMocks in beforeEach usually suffices
    });

    it('should have correct initial state', () => {
        const { result } = renderHook(() => useAuthCheck());
        expect(result.current.isLoading).toBe(true);
        expect(result.current.isAuthenticated).toBe(null);
        expect(result.current.user).toBe(null);
        // No waitFor needed here, we only test the state right after render
        // The pending promise mock prevents async errors/warnings later
    });

    it('should set isAuthenticated to false and loading to false if no token exists', () => {
        localStorageMock.removeItem(ACCESS_TOKEN);
        // No need to mock apiClient.get here as it shouldn't be called

        const { result } = renderHook(() => useAuthCheck());

        expect(result.current.isLoading).toBe(false);
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBe(null);
        expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should set isAuthenticated to true and loading to false if token exists and user is already in store', () => {
        const existingUser = { id: 2, name: 'Bob' };
        mockStoreState = { user: existingUser, setUser: setUserMock };
        localStorageMock.setItem(ACCESS_TOKEN, 'fake-token');
        // No need to mock apiClient.get here as it shouldn't be called

        const { result } = renderHook(() => useAuthCheck());

        expect(result.current.isLoading).toBe(false);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(existingUser);
        expect(apiClient.get).not.toHaveBeenCalled();
    });


    it('should call API, set user in store, and set isAuthenticated to true on success', async () => {
        const mockUser = { id: 1, name: 'Alice' };
        const mockApiClient = vi.mocked(apiClient);
        // Override the default pending mock for this specific test
        mockApiClient.get.mockResolvedValue({ data: mockUser });

        mockStoreState = { user: null, setUser: setUserMock };

        const { result } = renderHook(() => useAuthCheck());

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(apiClient.get).toHaveBeenCalledWith('/api/user/current/');
        expect(setUserMock).toHaveBeenCalledWith(mockUser);

        act(() => {
            mockStoreState = { user: mockUser, setUser: setUserMock };
        });
        expect(result.current.user).toBe(null);
    });


    it('should set isAuthenticated to false, remove token, and not set user when API returns 401', async () => {
        const error401 = { response: { status: 401 } };
        const mockApiClient = vi.mocked(apiClient);
        // Override the default pending mock for this specific test
        mockApiClient.get.mockRejectedValue(error401);

        mockStoreState = { user: null, setUser: setUserMock };

        const { result } = renderHook(() => useAuthCheck());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBe(null);
        expect(apiClient.get).toHaveBeenCalledWith('/api/user/current/');
        expect(setUserMock).not.toHaveBeenCalled();
        expect(localStorageMock.removeItem).toHaveBeenCalledWith(ACCESS_TOKEN);
    });

    it('should log error, keep isAuthenticated null, and not set user when API fails with other error', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const error500 = { message: 'Server error', response: { status: 500 } };
        const mockApiClient = vi.mocked(apiClient);
         // Override the default pending mock for this specific test
        mockApiClient.get.mockRejectedValue(error500);

        mockStoreState = { user: null, setUser: setUserMock };

        const { result } = renderHook(() => useAuthCheck());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isAuthenticated).toBe(null);
        expect(result.current.user).toBe(null);
        expect(apiClient.get).toHaveBeenCalledWith('/api/user/current/');
        expect(setUserMock).not.toHaveBeenCalled();
        expect(localStorageMock.removeItem).not.toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith('Auth check error:', error500);

        consoleErrorSpy.mockRestore();
    });
});