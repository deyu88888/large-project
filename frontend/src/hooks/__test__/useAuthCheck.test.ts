import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import useAuthCheck from '../useAuthCheck';
import { apiClient } from '../../api';

vi.mock('../../api');

describe('useAuthCheck', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should set isAuthenticated to true and return user when API call succeeds', async () => {
    const mockUser = { id: 1, name: 'Alice' };
    const mockApiClient = vi.mocked(apiClient);
    mockApiClient.get.mockResolvedValue({ data: mockUser });

    const { result } = renderHook(() => useAuthCheck());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });
  });

  it('should set isAuthenticated to false when API call returns 401', async () => {
    const error401 = {
      response: {
        status: 401,
      },
    };
    const mockApiClient = vi.mocked(apiClient);
    mockApiClient.get.mockRejectedValue(error401);

    const { result } = renderHook(() => useAuthCheck());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });
  });

  it('should log an error when API call fails with other error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error500 = {
      response: {
        status: 500,
      },
      message: 'Server error',
    };
    const mockApiClient = vi.mocked(apiClient);
    mockApiClient.get.mockRejectedValue(error500);

    const { result } = renderHook(() => useAuthCheck());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(null);
      expect(result.current.user).toBe(null);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Auth check failed:', error500);
    });

    consoleErrorSpy.mockRestore();
  });
});
